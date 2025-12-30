import { useState } from 'react';
import { useFavorites } from './useFavorites';

export const useFavorite = (propertyId: string) => {
    const { isFavorite: checkIsFavorite, toggleFavorite: toggle, isLoading: isListLoading } = useFavorites();
    const [isActionLoading, setIsActionLoading] = useState(false);

    const isFavorite = checkIsFavorite(propertyId);

    const toggleFavorite = async (e?: React.MouseEvent) => {
        if (e) {
            e.preventDefault();
            e.stopPropagation();
        }

        setIsActionLoading(true);
        try {
            await toggle(propertyId);
        } finally {
            setIsActionLoading(false);
        }
    };

    return {
        isFavorite,
        toggleFavorite,
        isLoading: isListLoading || isActionLoading
    };
};
