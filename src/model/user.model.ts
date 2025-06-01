import { supabase } from '../lib/supabase';

interface FollowResponse {
  success: boolean;
  message: string;
}

interface FollowType {
  follower_id: string;
  followed_id: string;
  followed_type: 'profile' | 'group' | 'event';
}

const UserModel = {
  // Function to get followers of a user
  async getFollowers(userId: string) {
    const { data: followers, error } = await supabase
      .from('follows')
      .select('follower_id, profiles!follows_follower_id_fkey(username)')
      .eq('followed_id', userId)
      .eq('followed_type', 'profile');

    if (error) {
      console.error("Error fetching followers:", error);
      throw error;
    }

    return followers;
  },

  // Function to get followers count of a user
  async getFollowersCount(userId: string) {
    const { count, error } = await supabase
      .from('follows')
      .select('follower_id', { count: 'exact' })
      .eq('followed_id', userId)
      .eq('followed_type', 'profile');

    if (error) {
      console.error("Error fetching followers count:", error);
      throw error;
    }

    return count;
  },

  // Function to get followings of a user
  async getFollowings(userId: string) {
    const { data: followings, error } = await supabase
      .from('follows')
      .select('followed_id, profiles!follows_followed_id_fkey(username)')
      .eq('follower_id', userId)
      .eq('followed_type', 'profile');

    if (error) {
      console.error("Error fetching followings:", error);
      throw error;
    }

    return followings;
  },

  // Function to get followings count of a user
  async getFollowingsCount(userId: string) {
    const { count, error } = await supabase
      .from('follows')
      .select('followed_id', { count: 'exact' })
      .eq('follower_id', userId)
      .eq('followed_type', 'profile');

    if (error) {
      console.error("Error fetching followings count:", error);
      throw error;
    }

    return count;
  },


  // Check if a user is following another user
  async isFollowing(followerId: string, followingId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('follows')
      .select('*')
      .eq('follower_id', followerId)
      .eq('followed_id', followingId)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is the error code for no rows returned
      console.error("Error checking follow status:", error);
      throw error;
    }

    return !!data;
  },

  // Follow a user
  async followUser(followerId: string, followingId: string): Promise<FollowResponse> {
    // First check if already following
    const isAlreadyFollowing = await this.isFollowing(followerId, followingId);

    if (isAlreadyFollowing) {
      return {
        success: false,
        message: 'Zaten takip ediyorsunuz'
      };
    }
    const data: FollowType = {
      follower_id: followerId,
      followed_id: followingId,
      followed_type: 'profile'
    }
    const { error } = await supabase
      .from('follows')
      .insert(data);

    if (error) {
      console.error("Error following user:", error);
      return {
        success: false,
        message: 'Takip edilirken bir hata oluştu'
      };
    }

    return {
      success: true,
      message: 'Kullanıcı takip edildi'
    };
  },

  // Unfollow a user
  async unfollowUser(followerId: string, followingId: string): Promise<FollowResponse> {
    const { error } = await supabase
      .from('follows')
      .delete()
      .eq('follower_id', followerId)
      .eq('followed_id', followingId);

    if (error) {
      console.error("Error unfollowing user:", error);
      return {
        success: false,
        message: 'Takipten çıkarılırken bir hata oluştu'
      };
    }

    return {
      success: true,
      message: 'Takipten çıkarıldı'
    };
  }

};

// Example usage
// (async () => {
//   const userId = 'your-user-id-here'; // Replace with the actual user ID

//   try {
//     const followers = await UserModel.getFollowers(userId);
//     console.log('Followers:', followers);

//     const followings = await UserModel.getFollowings(userId);
//     console.log('Followings:', followings);
//   } catch (error) {
//     console.error("Error:", error);
//   }
// })();

export default UserModel;
