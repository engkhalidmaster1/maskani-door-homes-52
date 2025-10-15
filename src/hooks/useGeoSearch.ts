import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { 
  GeoSearchEngine, 
  GeoSearchCriteria, 
  SearchOptions, 
  GeoSearchResult, 
  PropertyLocation,
  GeoCoordinate,
  GeoBounds
} from '@/services/geoSearchEngine';
import { useProperties } from './useProperties';

interface UseGeoSearchOptions {
  enableAutoComplete?: boolean;
  debounceMs?: number;
  defaultRadius?: number;
  cacheResults?: boolean;
}

interface UseGeoSearchReturn {
  // Search state
  results: GeoSearchResult[];
  isSearching: boolean;
  error: string | null;
  total: number;
  searchTime: number;
  bounds?: GeoBounds;

  // Search functions
  search: (criteria: GeoSearchCriteria, options?: SearchOptions) => Promise<void>;
  searchWithinRadius: (center: GeoCoordinate, radiusKm: number, options?: SearchOptions) => Promise<void>;
  searchWithinBounds: (bounds: GeoBounds, options?: SearchOptions) => Promise<void>;
  searchNearby: (location: GeoCoordinate, options?: SearchOptions) => Promise<void>;
  
  // Utility functions
  clearResults: () => void;
  loadMore: () => Promise<void>;
  refineSearch: (newCriteria: Partial<GeoSearchCriteria>) => Promise<void>;
  
  // Auto-complete and suggestions
  suggestions: string[];
  popularAreas: Array<{ name: string; center: GeoCoordinate; count: number }>;
  getSuggestions: (query: string) => void;
  
  // Search history
  searchHistory: GeoSearchCriteria[];
  saveSearch: (name: string) => void;
  loadSavedSearch: (index: number) => void;
  clearHistory: () => void;

  // Current search state
  currentCriteria?: GeoSearchCriteria;
  currentOptions?: SearchOptions;
  hasMore: boolean;
  page: number;
}

export const useGeoSearch = (options: UseGeoSearchOptions = {}): UseGeoSearchReturn => {
  const {
    enableAutoComplete = true,
    debounceMs = 300,
    defaultRadius = 5,
    cacheResults = true
  } = options;

  // Get properties from the properties hook
  const { properties } = useProperties();
  
  // Create search engine instance
  const searchEngine = useMemo(() => new GeoSearchEngine(), []);
  
  // Update search engine when properties change
  useEffect(() => {
    if (properties.length > 0) {
      const propertyLocations: PropertyLocation[] = properties.map(property => ({
        id: property.id.toString(),
        title: property.title,
        description: property.description || '',
        price: property.price,
        propertyType: property.property_type || 'apartment',
        features: property.amenities || [],
        address: property.location || property.address,
        neighborhood: property.location, // Using location as neighborhood for now
        city: property.location, // Using location as city for now  
        latitude: property.latitude || 0,
        longitude: property.longitude || 0,
        images: property.images || [],
        createdAt: property.created_at ? new Date(property.created_at) : new Date()
      }));
      
      searchEngine.updateProperties(propertyLocations);
    }
  }, [properties, searchEngine]);

  // Search state
  const [results, setResults] = useState<GeoSearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [searchTime, setSearchTime] = useState(0);
  const [bounds, setBounds] = useState<GeoBounds | undefined>();
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  
  // Auto-complete state
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [popularAreas] = useState(() => searchEngine.getPopularAreas());
  
  // Search history
  const [searchHistory, setSearchHistory] = useState<GeoSearchCriteria[]>([]);
  const [currentCriteria, setCurrentCriteria] = useState<GeoSearchCriteria | undefined>();
  const [currentOptions, setCurrentOptions] = useState<SearchOptions | undefined>();
  
  // Cache for search results
  const searchCache = useRef(new Map<string, {
    results: GeoSearchResult[];
    total: number;
    bounds?: GeoBounds;
    timestamp: number;
  }>());

  // Debounce timer
  const debounceTimer = useRef<NodeJS.Timeout>();

  // Load search history from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('geo_search_history');
      if (saved) {
        setSearchHistory(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load search history:', error);
    }
  }, []);

  // Save search history to localStorage
  const saveSearchHistory = useCallback((history: GeoSearchCriteria[]) => {
    try {
      localStorage.setItem('geo_search_history', JSON.stringify(history.slice(0, 10))); // Keep last 10
    } catch (error) {
      console.error('Failed to save search history:', error);
    }
  }, []);

  // Generate cache key for search
  const getCacheKey = useCallback((criteria: GeoSearchCriteria, options: SearchOptions): string => {
    return btoa(JSON.stringify({ criteria, options }));
  }, []);

  // Main search function
  const search = useCallback(async (
    criteria: GeoSearchCriteria, 
    searchOptions: SearchOptions = {}
  ): Promise<void> => {
    setIsSearching(true);
    setError(null);
    setPage(1);

    try {
      // Check cache first
      const cacheKey = getCacheKey(criteria, searchOptions);
      const cached = searchCache.current.get(cacheKey);
      
      if (cacheResults && cached && (Date.now() - cached.timestamp < 300000)) { // 5 minutes cache
        setResults(cached.results);
        setTotal(cached.total);
        setBounds(cached.bounds);
        setSearchTime(0);
        setCurrentCriteria(criteria);
        setCurrentOptions(searchOptions);
        setHasMore(cached.results.length < cached.total);
        return;
      }

      // Perform search
      const searchResult = await searchEngine.search(criteria, {
        limit: 20,
        offset: 0,
        includeAmenities: true,
        ...searchOptions
      });

      // Cache results
      if (cacheResults) {
        searchCache.current.set(cacheKey, {
          ...searchResult,
          timestamp: Date.now()
        });
      }

      // Update state
      setResults(searchResult.results);
      setTotal(searchResult.total);
      setBounds(searchResult.bounds);
      setSearchTime(searchResult.searchTime);
      setCurrentCriteria(criteria);
      setCurrentOptions(searchOptions);
      setHasMore(searchResult.results.length < searchResult.total);

      // Add to search history
      const newHistory = [criteria, ...searchHistory.filter(h => 
        JSON.stringify(h) !== JSON.stringify(criteria)
      )];
      setSearchHistory(newHistory);
      saveSearchHistory(newHistory);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ في البحث');
      setResults([]);
      setTotal(0);
      setBounds(undefined);
    } finally {
      setIsSearching(false);
    }
  }, [searchEngine, cacheResults, getCacheKey, searchHistory, saveSearchHistory]);

  // Search within radius
  const searchWithinRadius = useCallback(async (
    center: GeoCoordinate,
    radiusKm: number,
    searchOptions: SearchOptions = {}
  ): Promise<void> => {
    await search({ center, radiusKm }, searchOptions);
  }, [search]);

  // Search within bounds
  const searchWithinBounds = useCallback(async (
    searchBounds: GeoBounds,
    searchOptions: SearchOptions = {}
  ): Promise<void> => {
    // Calculate center point for bounds
    const center: GeoCoordinate = {
      latitude: (searchBounds.northeast.latitude + searchBounds.southwest.latitude) / 2,
      longitude: (searchBounds.northeast.longitude + searchBounds.southwest.longitude) / 2
    };
    
    await search({ center, bounds: searchBounds }, searchOptions);
  }, [search]);

  // Search nearby properties
  const searchNearby = useCallback(async (
    location: GeoCoordinate,
    searchOptions: SearchOptions = {}
  ): Promise<void> => {
    await searchWithinRadius(location, defaultRadius, {
      sortBy: 'distance',
      includeAmenities: true,
      ...searchOptions
    });
  }, [searchWithinRadius, defaultRadius]);

  // Load more results (pagination)
  const loadMore = useCallback(async (): Promise<void> => {
    if (!currentCriteria || !hasMore || isSearching) return;

    setIsSearching(true);
    try {
      const nextPage = page + 1;
      const offset = (nextPage - 1) * 20;

      const searchResult = await searchEngine.search(currentCriteria, {
        limit: 20,
        offset,
        includeAmenities: true,
        ...currentOptions
      });

      setResults(prev => [...prev, ...searchResult.results]);
      setPage(nextPage);
      setHasMore(results.length + searchResult.results.length < total);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ في تحميل المزيد');
    } finally {
      setIsSearching(false);
    }
  }, [currentCriteria, currentOptions, hasMore, isSearching, page, results.length, total, searchEngine]);

  // Refine current search
  const refineSearch = useCallback(async (
    newCriteria: Partial<GeoSearchCriteria>
  ): Promise<void> => {
    if (!currentCriteria) return;
    
    const refinedCriteria = { ...currentCriteria, ...newCriteria };
    await search(refinedCriteria, currentOptions);
  }, [currentCriteria, currentOptions, search]);

  // Clear search results
  const clearResults = useCallback(() => {
    setResults([]);
    setTotal(0);
    setBounds(undefined);
    setError(null);
    setPage(1);
    setHasMore(false);
    setCurrentCriteria(undefined);
    setCurrentOptions(undefined);
  }, []);

  // Get search suggestions with debounce
  const getSuggestions = useCallback((query: string) => {
    if (!enableAutoComplete) return;
    
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    debounceTimer.current = setTimeout(() => {
      const newSuggestions = searchEngine.getSearchSuggestions(query);
      setSuggestions(newSuggestions);
    }, debounceMs);
  }, [searchEngine, enableAutoComplete, debounceMs]);

  // Save current search with a name
  const saveSearch = useCallback((name: string) => {
    if (!currentCriteria) return;
    
    const savedSearches = JSON.parse(localStorage.getItem('saved_geo_searches') || '[]');
    const newSavedSearch = {
      name,
      criteria: currentCriteria,
      options: currentOptions,
      timestamp: Date.now()
    };
    
    savedSearches.push(newSavedSearch);
    localStorage.setItem('saved_geo_searches', JSON.stringify(savedSearches.slice(0, 20))); // Keep last 20
  }, [currentCriteria, currentOptions]);

  // Load saved search
  const loadSavedSearch = useCallback(async (index: number) => {
    try {
      const savedSearches = JSON.parse(localStorage.getItem('saved_geo_searches') || '[]');
      const savedSearch = savedSearches[index];
      
      if (savedSearch) {
        await search(savedSearch.criteria, savedSearch.options);
      }
    } catch (error) {
      setError('فشل في تحميل البحث المحفوظ');
    }
  }, [search]);

  // Clear search history
  const clearHistory = useCallback(() => {
    setSearchHistory([]);
    localStorage.removeItem('geo_search_history');
    localStorage.removeItem('saved_geo_searches');
  }, []);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return {
    // Search state
    results,
    isSearching,
    error,
    total,
    searchTime,
    bounds,

    // Search functions
    search,
    searchWithinRadius,
    searchWithinBounds,
    searchNearby,
    
    // Utility functions
    clearResults,
    loadMore,
    refineSearch,
    
    // Auto-complete and suggestions
    suggestions,
    popularAreas,
    getSuggestions,
    
    // Search history
    searchHistory,
    saveSearch,
    loadSavedSearch,
    clearHistory,

    // Current search state
    currentCriteria,
    currentOptions,
    hasMore,
    page
  };
};