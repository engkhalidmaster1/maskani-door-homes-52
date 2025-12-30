import { useAddPropertyForm } from "@/hooks/useAddPropertyForm";
import { usePerformanceMonitor } from "@/hooks/usePerformanceMonitor";
import {
  UserStatusHeader,
  BasicInfoSection,
  PropertyTypeSection,
  PropertyDetailsSection,
  FloorAndRoomsSection,
  PriceAndLocationSection,
  AdditionalDetailsSection,
  LocationMapSection,
  PropertyImagesSection,
  SubmitSection,
} from "@/components/Property/AddProperty";
import { GovernorateSection } from "@/components/Property/AddProperty/GovernorateSection";
import type { GovernorateType } from "@/components/Property/AddProperty/GovernorateSection";

export const AddProperty = () => {
  const {
    // State
    formData,
    selectedImages,
    imagePreviewUrls,
    isLoading,
    showFurnishedField,

    // Computed values

    // Handlers
    handleFormChange,
    handleTypeChange,
    handleLocationSelect,
    handleImageChange,
    removeImage,
    resetForm,
    handleSubmit,

    // External data
    user,
    isAdmin,
    userStatus,
    canAddProperty,
    getRemainingProperties,
  } = useAddPropertyForm();

  // Performance monitoring
  const {
    isPerformanceHealthy,
    getFormattedMemoryInfo,
    renderCount
  } = usePerformanceMonitor('AddProperty', {
    enableMemoryTracking: true,
    enableRenderTracking: true,
    logToConsole: process.env.NODE_ENV === 'development'
  });



  // Show loading state if user status not loaded
  if (!userStatus) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">جاري تحميل معلومات حسابك...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto">
        <div className="p-6">
          <UserStatusHeader
            userStatus={userStatus}
            getRemainingProperties={getRemainingProperties}
            canAddProperty={canAddProperty}
          />

          <form onSubmit={handleSubmit} className="space-y-0">
            <BasicInfoSection
              formData={formData}
              onChange={handleFormChange}
            />

            <GovernorateSection
              selectedGovernorate={formData.governorate || ''}
              onChange={(gov: GovernorateType) => handleFormChange('governorate', gov)}
            />

            <PropertyTypeSection
              formData={formData}
              onChange={handleFormChange}
              onTypeChange={handleTypeChange}
            />

            <PropertyDetailsSection
              formData={formData}
              onChange={handleFormChange}
            />

            <FloorAndRoomsSection
              formData={formData}
              onChange={handleFormChange}
            />

            <PriceAndLocationSection
              formData={formData}
              onChange={handleFormChange}
            />

            <AdditionalDetailsSection
              formData={formData}
              onChange={handleFormChange}
              showFurnishedField={showFurnishedField}
            />

            <LocationMapSection
              latitude={formData.latitude}
              longitude={formData.longitude}
              address={formData.address}
              location={formData.location}
              governorate={formData.governorate}
              onLocationSelect={handleLocationSelect}
            />

            <PropertyImagesSection
              selectedImages={selectedImages}
              imagePreviewUrls={imagePreviewUrls}
              userStatus={userStatus}
              onImageChange={handleImageChange}
              onRemoveImage={removeImage}
            />

            <SubmitSection
              isLoading={isLoading}
              canAddProperty={canAddProperty}
              userStatus={userStatus}
              onReset={resetForm}
            />
          </form>
        </div>
      </div>
    </div>
  );
};