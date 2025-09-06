# Post Components

Bu klasör Instagram tarzı post component'lerini içerir. Tüm component'ler modüler ve yeniden kullanılabilir şekilde tasarlanmıştır.

## Component'ler

### UniversalPost
Ana post component'i. Sadece `postId` ve `userId` parametrelerini alır.

```tsx
<UniversalPost
  postId="123"
  userId="user123"
  showFullScreen={false}
  actions={{
    onLike: (postId, isLiked) => console.log('Like', postId, isLiked),
    onComment: (postId) => console.log('Comment', postId),
    onShare: (postId) => console.log('Share', postId),
    onSave: (postId) => console.log('Save', postId),
    onProfilePress: (userId) => console.log('Profile', userId),
  }}
/>
```

### PostHeader
Post başlığı component'i.

```tsx
<PostHeader
  username="kullanici123"
  userImage="https://example.com/image.jpg"
  location="İstanbul"
  onProfilePress={() => console.log('Profile pressed')}
/>
```

### ImageCarousel
Resim carousel component'i.

```tsx
<ImageCarousel
  images={['url1', 'url2', 'url3']}
  currentIndex={0}
  onIndexChange={(index) => setCurrentIndex(index)}
  height={400}
/>
```

### PostActions
Post aksiyon butonları component'i.

```tsx
<PostActions
  isLiked={false}
  likeCount={42}
  commentCount={5}
  onLike={() => console.log('Like')}
  onComment={() => console.log('Comment')}
  onShare={() => console.log('Share')}
  onSave={() => console.log('Save')}
/>
```

### PostCaption
Post açıklama component'i.

```tsx
<PostCaption
  username="kullanici123"
  title="Güzel bir gün"
  description="Bugün harika bir gün geçirdim"
  commentCount={5}
  timeAgo="2s"
  onComment={() => console.log('Comment')}
/>
```

## Hooks

### usePost
Post verilerini yönetir.

```tsx
const { post, loading, error, refreshPost } = usePost(postId, userId);
```

### usePostActions
Post aksiyonlarını yönetir.

```tsx
const { 
  isLiked, 
  likeCount, 
  commentCount, 
  handleLike, 
  handleComment, 
  handleShare, 
  handleSave 
} = usePostActions(postId, userId, postOwnerId);
```

### useImages
Resim carousel'ini yönetir.

```tsx
const { 
  images, 
  loading, 
  currentIndex, 
  handleImageScroll, 
  goToImage 
} = useImages(postId);
```

## Services

### PostService
Post işlemleri için service.

```tsx
const post = await PostService.getPost(postId, userId);
const success = await PostService.likePost(postId, postOwnerId, userId);
```

### ImageService
Resim işlemleri için service.

```tsx
const images = await ImageService.getPostImages(postId, userId);
const imageUrl = await ImageService.uploadImage(imageUri, userId, postId);
```

## Yeni Özellik Ekleme

1. **Yeni Component**: `src/components/post/` klasörüne ekle
2. **Yeni Hook**: `src/hooks/` klasörüne ekle
3. **Yeni Service**: `src/services/` klasörüne ekle
4. **Type Definition**: `src/types/post.types.ts` dosyasına ekle
5. **Export**: `src/components/index.ts` dosyasına ekle

## Örnek Kullanım

```tsx
// Ana sayfa
<UniversalPost postId="123" userId={currentUserId} />

// Detay sayfası
<UniversalPost 
  postId="123" 
  userId={currentUserId} 
  showFullScreen={true} 
/>

// Özel aksiyonlarla
<UniversalPost
  postId="123"
  userId={currentUserId}
  actions={{
    onLike: (postId, isLiked) => {
      // Özel like logic'i
    },
    onComment: (postId) => {
      // Özel comment logic'i
    }
  }}
/>
```
