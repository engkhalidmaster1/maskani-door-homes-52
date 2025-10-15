import { getDistance, isPointWithinRadius, getBounds, getCenterOfBounds } from 'geolib';
import { point, buffer, bboxPolygon, booleanPointInPolygon } from '@turf/turf';
import Fuse from 'fuse.js';

/**
 * Smart Geographic Search Engine
 * محرك البحث الجغرافي الذكي
 */

// Geographic coordinate interface
export interface GeoCoordinate {
  latitude: number;
  longitude: number;
  accuracy?: number;
}

// Geographic bounds interface
export interface GeoBounds {
  northeast: GeoCoordinate;
  southwest: GeoCoordinate;
}

// Search criteria interface
export interface GeoSearchCriteria {
  center: GeoCoordinate;
  radiusKm?: number;
  bounds?: GeoBounds;
  polygon?: GeoCoordinate[];
  amenities?: string[];
  priceRange?: {
    min: number;
    max: number;
  };
  propertyType?: string[];
  features?: string[];
  excludeIds?: string[];
  searchQuery?: string;
}

// Property location interface
export interface PropertyLocation extends GeoCoordinate {
  id: string;
  title: string;
  description?: string;
  price?: number;
  propertyType?: string;
  features?: string[];
  address?: string;
  neighborhood?: string;
  city?: string;
  amenities?: NearbyAmenity[];
  images?: string[];
  createdAt?: Date;
}

// Nearby amenity interface
export interface NearbyAmenity {
  id: string;
  name: string;
  type: 'school' | 'hospital' | 'mosque' | 'market' | 'restaurant' | 'bank' | 'pharmacy' | 'park' | 'transport';
  location: GeoCoordinate;
  distance?: number; // in meters
  rating?: number;
}

// Search result interface
export interface GeoSearchResult {
  property: PropertyLocation;
  distance: number; // in meters
  relevanceScore: number; // 0-1
  matchedCriteria: string[];
  nearbyAmenities: NearbyAmenity[];
}

// Search options interface
export interface SearchOptions {
  limit?: number;
  offset?: number;
  sortBy?: 'distance' | 'price' | 'relevance' | 'newest';
  sortOrder?: 'asc' | 'desc';
  includeAmenities?: boolean;
  amenityRadius?: number; // in meters
  fuzzySearch?: boolean;
  boostFactors?: {
    priceMatch?: number;
    typeMatch?: number;
    featureMatch?: number;
    proximityBoost?: number;
  };
}

// Amenity database (mock data - in real app would come from external API)
const MOCK_AMENITIES: NearbyAmenity[] = [
  // Baghdad amenities
  { id: '1', name: 'مستشفى بغداد التعليمي', type: 'hospital', location: { latitude: 33.3152, longitude: 44.3661 } },
  { id: '2', name: 'جامعة بغداد', type: 'school', location: { latitude: 33.3073, longitude: 44.3828 } },
  { id: '3', name: 'جامع الكاظمية', type: 'mosque', location: { latitude: 33.3806, longitude: 44.3407 } },
  { id: '4', name: 'سوق الشورجة', type: 'market', location: { latitude: 33.3435, longitude: 44.4009 } },
  { id: '5', name: 'حديقة الزوراء', type: 'park', location: { latitude: 33.3197, longitude: 44.3923 } },
  
  // Erbil amenities
  { id: '6', name: 'مستشفى أربيل التعليمي', type: 'hospital', location: { latitude: 36.1911, longitude: 44.0093 } },
  { id: '7', name: 'جامعة صلاح الدين', type: 'school', location: { latitude: 36.1833, longitude: 44.0089 } },
  { id: '8', name: 'قلعة أربيل', type: 'park', location: { latitude: 36.1911, longitude: 44.0093 } },
  
  // Basra amenities
  { id: '9', name: 'مستشفى البصرة العام', type: 'hospital', location: { latitude: 30.5085, longitude: 47.7804 } },
  { id: '10', name: 'جامعة البصرة', type: 'school', location: { latitude: 30.5404, longitude: 47.7851 } },
];

export class GeoSearchEngine {
  private properties: PropertyLocation[] = [];
  private fuseSearch: Fuse<PropertyLocation>;

  constructor(properties: PropertyLocation[] = []) {
    this.properties = properties;
    this.initializeFuseSearch();
  }

  /**
   * Initialize Fuse.js for fuzzy text searching
   */
  private initializeFuseSearch(): void {
    const fuseOptions = {
      keys: [
        { name: 'title', weight: 0.3 },
        { name: 'description', weight: 0.2 },
        { name: 'address', weight: 0.2 },
        { name: 'neighborhood', weight: 0.15 },
        { name: 'city', weight: 0.1 },
        { name: 'features', weight: 0.05 }
      ],
      threshold: 0.4,
      includeScore: true,
      includeMatches: true
    };

    this.fuseSearch = new Fuse(this.properties, fuseOptions);
  }

  /**
   * Update properties list
   */
  public updateProperties(properties: PropertyLocation[]): void {
    this.properties = properties;
    this.initializeFuseSearch();
  }

  /**
   * Main search function
   */
  public async search(
    criteria: GeoSearchCriteria,
    options: SearchOptions = {}
  ): Promise<{
    results: GeoSearchResult[];
    total: number;
    bounds?: GeoBounds;
    searchTime: number;
  }> {
    const startTime = Date.now();
    
    let filteredProperties = [...this.properties];

    // Apply geographic filtering
    filteredProperties = this.applyGeographicFilters(filteredProperties, criteria);

    // Apply property filters
    filteredProperties = this.applyPropertyFilters(filteredProperties, criteria);

    // Apply text search if needed
    if (options.fuzzySearch && criteria.searchQuery) {
      filteredProperties = this.applyTextSearch(filteredProperties, criteria.searchQuery);
    }

    // Calculate relevance scores and distances
    const resultsWithScores = await Promise.all(
      filteredProperties.map(async property => {
        const distance = this.calculateDistance(criteria.center, property);
        const relevanceScore = this.calculateRelevanceScore(property, criteria, distance, options);
        const nearbyAmenities = options.includeAmenities 
          ? await this.findNearbyAmenities(property, options.amenityRadius || 2000)
          : [];

        return {
          property,
          distance,
          relevanceScore,
          matchedCriteria: this.getMatchedCriteria(property, criteria),
          nearbyAmenities
        };
      })
    );

    // Sort results
    const sortedResults = this.sortResults(resultsWithScores, options);

    // Apply pagination
    const { limit = 20, offset = 0 } = options;
    const paginatedResults = sortedResults.slice(offset, offset + limit);

    // Calculate search bounds
    const bounds = this.calculateSearchBounds(paginatedResults.map(r => r.property));

    const searchTime = Date.now() - startTime;

    return {
      results: paginatedResults,
      total: sortedResults.length,
      bounds,
      searchTime
    };
  }

  /**
   * Search properties within radius
   */
  public searchWithinRadius(
    center: GeoCoordinate,
    radiusKm: number,
    options: SearchOptions = {}
  ): Promise<{
    results: GeoSearchResult[];
    total: number;
    bounds?: GeoBounds;
    searchTime: number;
  }> {
    return this.search({ center, radiusKm }, options);
  }

  /**
   * Search properties within bounds
   */
  public searchWithinBounds(
    bounds: GeoBounds,
    options: SearchOptions = {}
  ): Promise<{
    results: GeoSearchResult[];
    total: number;
    bounds?: GeoBounds;
    searchTime: number;
  }> {
    const center = getCenterOfBounds([bounds.southwest, bounds.northeast]);
    return this.search({ 
      center: { latitude: center.latitude, longitude: center.longitude },
      bounds 
    }, options);
  }

  /**
   * Search properties within polygon
   */
  public searchWithinPolygon(
    polygon: GeoCoordinate[],
    options: SearchOptions = {}
  ): Promise<{
    results: GeoSearchResult[];
    total: number;
    bounds?: GeoBounds;
    searchTime: number;
  }> {
    const bounds = getBounds(polygon);
    const center = getCenterOfBounds(polygon);
    
    return this.search({
      center: { latitude: center.latitude, longitude: center.longitude },
      polygon
    }, options);
  }

  /**
   * Find nearby amenities for a property
   */
  public async findNearbyAmenities(
    property: GeoCoordinate,
    radiusMeters: number = 2000
  ): Promise<NearbyAmenity[]> {
    return MOCK_AMENITIES
      .map(amenity => ({
        ...amenity,
        distance: getDistance(property, amenity.location)
      }))
      .filter(amenity => amenity.distance! <= radiusMeters)
      .sort((a, b) => a.distance! - b.distance!)
      .slice(0, 10); // Limit to 10 closest amenities
  }

  /**
   * Apply geographic filters
   */
  private applyGeographicFilters(
    properties: PropertyLocation[],
    criteria: GeoSearchCriteria
  ): PropertyLocation[] {
    let filtered = properties;

    // Filter by radius
    if (criteria.radiusKm) {
      filtered = filtered.filter(property =>
        isPointWithinRadius(
          criteria.center,
          property,
          criteria.radiusKm! * 1000 // Convert km to meters
        )
      );
    }

    // Filter by bounds
    if (criteria.bounds) {
      filtered = filtered.filter(property => {
        const { latitude, longitude } = property;
        return (
          latitude >= criteria.bounds!.southwest.latitude &&
          latitude <= criteria.bounds!.northeast.latitude &&
          longitude >= criteria.bounds!.southwest.longitude &&
          longitude <= criteria.bounds!.northeast.longitude
        );
      });
    }

    // Filter by polygon
    if (criteria.polygon && criteria.polygon.length >= 3) {
      filtered = filtered.filter(property => {
        const propertyPoint = point([property.longitude, property.latitude]);
        const polygonCoords = criteria.polygon!.map(coord => [coord.longitude, coord.latitude]);
        polygonCoords.push(polygonCoords[0]); // Close the polygon
        
        const polygon = {
          type: 'Polygon' as const,
          coordinates: [polygonCoords]
        };
        
        return booleanPointInPolygon(propertyPoint, polygon);
      });
    }

    return filtered;
  }

  /**
   * Apply property-specific filters
   */
  private applyPropertyFilters(
    properties: PropertyLocation[],
    criteria: GeoSearchCriteria
  ): PropertyLocation[] {
    let filtered = properties;

    // Filter by price range
    if (criteria.priceRange) {
      filtered = filtered.filter(property => {
        if (!property.price) return false;
        return (
          property.price >= criteria.priceRange!.min &&
          property.price <= criteria.priceRange!.max
        );
      });
    }

    // Filter by property type
    if (criteria.propertyType && criteria.propertyType.length > 0) {
      filtered = filtered.filter(property => 
        property.propertyType && 
        criteria.propertyType!.includes(property.propertyType)
      );
    }

    // Filter by features
    if (criteria.features && criteria.features.length > 0) {
      filtered = filtered.filter(property => 
        property.features && 
        criteria.features!.some(feature => 
          property.features!.includes(feature)
        )
      );
    }

    // Exclude specific IDs
    if (criteria.excludeIds && criteria.excludeIds.length > 0) {
      filtered = filtered.filter(property => 
        !criteria.excludeIds!.includes(property.id)
      );
    }

    return filtered;
  }

  /**
   * Apply fuzzy text search
   */
  private applyTextSearch(
    properties: PropertyLocation[],
    searchQuery: string
  ): PropertyLocation[] {
    if (!searchQuery.trim()) return properties;

    const results = this.fuseSearch.search(searchQuery);
    const propertyIds = new Set(results.map(result => result.item.id));
    
    return properties.filter(property => propertyIds.has(property.id));
  }

  /**
   * Calculate distance between two points
   */
  private calculateDistance(point1: GeoCoordinate, point2: GeoCoordinate): number {
    return getDistance(point1, point2);
  }

  /**
   * Calculate relevance score for a property
   */
  private calculateRelevanceScore(
    property: PropertyLocation,
    criteria: GeoSearchCriteria,
    distance: number,
    options: SearchOptions
  ): number {
    let score = 1.0;
    const boostFactors = options.boostFactors || {};

    // Distance factor (closer properties score higher)
    const maxDistance = (criteria.radiusKm || 10) * 1000; // Convert to meters
    const distanceFactor = 1 - (distance / maxDistance);
    score *= distanceFactor * (boostFactors.proximityBoost || 0.3);

    // Price match factor
    if (criteria.priceRange && property.price) {
      const priceRange = criteria.priceRange.max - criteria.priceRange.min;
      const priceDiff = Math.abs(property.price - ((criteria.priceRange.min + criteria.priceRange.max) / 2));
      const priceFactor = 1 - (priceDiff / priceRange);
      score += priceFactor * (boostFactors.priceMatch || 0.2);
    }

    // Property type match
    if (criteria.propertyType && property.propertyType) {
      if (criteria.propertyType.includes(property.propertyType)) {
        score += boostFactors.typeMatch || 0.25;
      }
    }

    // Features match
    if (criteria.features && property.features) {
      const matchedFeatures = criteria.features.filter(feature => 
        property.features!.includes(feature)
      ).length;
      const featureScore = matchedFeatures / criteria.features.length;
      score += featureScore * (boostFactors.featureMatch || 0.25);
    }

    // Normalize score to 0-1 range
    return Math.min(Math.max(score, 0), 1);
  }

  /**
   * Get matched criteria for a property
   */
  private getMatchedCriteria(
    property: PropertyLocation,
    criteria: GeoSearchCriteria
  ): string[] {
    const matched: string[] = [];

    if (criteria.priceRange && property.price) {
      if (property.price >= criteria.priceRange.min && property.price <= criteria.priceRange.max) {
        matched.push('price');
      }
    }

    if (criteria.propertyType && property.propertyType) {
      if (criteria.propertyType.includes(property.propertyType)) {
        matched.push('type');
      }
    }

    if (criteria.features && property.features) {
      const hasMatchingFeatures = criteria.features.some(feature => 
        property.features!.includes(feature)
      );
      if (hasMatchingFeatures) {
        matched.push('features');
      }
    }

    return matched;
  }

  /**
   * Sort search results
   */
  private sortResults(
    results: GeoSearchResult[],
    options: SearchOptions
  ): GeoSearchResult[] {
    const { sortBy = 'relevance', sortOrder = 'desc' } = options;

    return results.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'distance':
          comparison = a.distance - b.distance;
          break;
        case 'price': {
          const priceA = a.property.price || 0;
          const priceB = b.property.price || 0;
          comparison = priceA - priceB;
          break;
        }
        case 'relevance':
          comparison = b.relevanceScore - a.relevanceScore;
          break;
        case 'newest': {
          const dateA = a.property.createdAt?.getTime() || 0;
          const dateB = b.property.createdAt?.getTime() || 0;
          comparison = dateB - dateA;
          break;
        }
      }

      return sortOrder === 'desc' ? -comparison : comparison;
    });
  }

  /**
   * Calculate bounds for search results
   */
  private calculateSearchBounds(properties: PropertyLocation[]): GeoBounds | undefined {
    if (properties.length === 0) return undefined;

    const bounds = getBounds(properties);
    
    return {
      northeast: { latitude: bounds.maxLat, longitude: bounds.maxLng },
      southwest: { latitude: bounds.minLat, longitude: bounds.minLng }
    };
  }

  /**
   * Get search suggestions based on popular searches
   */
  public getSearchSuggestions(query: string): string[] {
    const suggestions = [
      'شقة في الكرادة',
      'بيت في الجادرية', 
      'مكتب في المنصور',
      'فيلا في الحارثية',
      'شقة قريبة من الجامعة',
      'بيت مع حديقة',
      'مكتب في وسط المدينة',
      'شقة مفروشة',
      'بيت للإيجار',
      'مكتب للبيع'
    ];

    if (!query.trim()) return suggestions.slice(0, 5);

    return suggestions.filter(suggestion => 
      suggestion.includes(query.trim())
    ).slice(0, 5);
  }

  /**
   * Get popular search areas
   */
  public getPopularAreas(): Array<{ name: string; center: GeoCoordinate; count: number }> {
    return [
      { name: 'الكرادة', center: { latitude: 33.3073, longitude: 44.3928 }, count: 156 },
      { name: 'الجادرية', center: { latitude: 33.2778, longitude: 44.3667 }, count: 134 },
      { name: 'المنصور', center: { latitude: 33.3167, longitude: 44.3167 }, count: 98 },
      { name: 'الحارثية', center: { latitude: 33.3361, longitude: 44.3261 }, count: 87 },
      { name: 'الكاظمية', center: { latitude: 33.3806, longitude: 44.3407 }, count: 76 },
      { name: 'الدورة', center: { latitude: 33.2167, longitude: 44.3167 }, count: 65 },
      { name: 'المدينة', center: { latitude: 33.3428, longitude: 44.4009 }, count: 54 },
      { name: 'الأعظمية', center: { latitude: 33.3747, longitude: 44.4192 }, count: 43 }
    ];
  }
}