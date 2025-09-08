import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { ImageService } from '../services/ImageService';

export const useImages = (postId: string, userId?: string) => {
  const [images, setImages] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadRouteImages = async () => {
      if (!postId) {
        setImages([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError(null);

      try {
        // Get all route points for this post (including stops)
        const { data: routes, error: routesError } = await supabase
          .from('routes')
          .select('id, image_url, order_index, user_id')
          .or(`id.eq.${postId},parent_id.eq.${postId}`)
          .eq('is_deleted', false)
          .eq('is_hidden', false)
          .not('image_url', 'is', null) // Only get routes with images
          .order('order_index', { ascending: true });

        if (routesError) {
          console.error('Error fetching route images:', routesError);
          setError('Resimler yüklenirken hata oluştu');
          setImages([]);
          return;
        }

        console.log(`🔍 useImages: Found ${routes?.length || 0} routes for postId: ${postId}`, routes);

        if (!routes || routes.length === 0) {
          console.log('No images found for post:', postId);
          setImages([]);
          setLoading(false);
          return;
        }

        // Download images using ImageService
        const downloadedImages: string[] = [];
        
        for (const route of routes) {
          if (route.image_url && route.user_id) {
            try {
              console.log(`📥 Downloading image: ${route.image_url} for user: ${route.user_id}`);
              const imageUri = await ImageService.downloadPostImage(
                route.image_url,
                route.user_id
              );
              
              if (imageUri) {
                console.log(`✅ Successfully downloaded image for route ${route.id}`);
                downloadedImages.push(imageUri);
              } else {
                console.warn(`❌ Failed to download image for route ${route.id} - no URI returned`);
              }
            } catch (downloadError) {
              console.warn(`❌ Failed to download image for route ${route.id}:`, downloadError);
              // Continue with other images even if one fails
            }
          } else {
            console.warn(`⚠️ Route ${route.id} missing image_url or user_id:`, { 
              image_url: route.image_url, 
              user_id: route.user_id 
            });
          }
        }

        console.log(`🎯 useImages: Downloaded ${downloadedImages.length} images for postId: ${postId}`);
        setImages(downloadedImages);
        
        if (downloadedImages.length === 0) {
          setError('Bu gönderi için resim bulunamadı');
        }
        
      } catch (error) {
        console.error('Error in loadRouteImages:', error);
        setError('Resimler yüklenirken beklenmeyen bir hata oluştu');
        setImages([]);
      } finally {
        setLoading(false);
      }
    };

    loadRouteImages();
  }, [postId, userId]);

  const handleImageScroll = (event: any, screenWidth: number) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const index = Math.round(contentOffsetX / screenWidth);
    setCurrentIndex(index);
  };

  const goToImage = (index: number) => {
    if (index >= 0 && index < images.length) {
      setCurrentIndex(index);
    }
  };

  const refreshImages = async () => {
    // Clear cache for this post and reload
    if (postId) {
      const cacheKey = `post_images_${postId}`;
      ImageService.clearCache(); // Clear all cache for now, can be optimized later
    }
    
    // Reload images
    const loadRouteImages = async () => {
      if (!postId) return;

      setLoading(true);
      setError(null);

      try {
        const { data: routes, error: routesError } = await supabase
          .from('routes')
          .select('id, image_url, order_index, user_id')
          .or(`id.eq.${postId},parent_id.eq.${postId}`)
          .eq('is_deleted', false)
          .eq('is_hidden', false)
          .not('image_url', 'is', null)
          .order('order_index', { ascending: true });

        if (routesError) throw routesError;

        const downloadedImages: string[] = [];
        
        for (const route of routes || []) {
          if (route.image_url && route.user_id) {
            const imageUri = await ImageService.downloadPostImage(
              route.image_url,
              route.user_id
            );
            
            if (imageUri) {
              downloadedImages.push(imageUri);
            }
          }
        }

        setImages(downloadedImages);
      } catch (error) {
        console.error('Error refreshing images:', error);
        setError('Resimler yenilenirken hata oluştu');
      } finally {
        setLoading(false);
      }
    };

    loadRouteImages();
  };

  return {
    images,
    loading,
    error,
    currentIndex,
    handleImageScroll,
    goToImage,
    refreshImages,
  };
};
