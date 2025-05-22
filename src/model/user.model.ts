import { supabase } from '../lib/supabase';



const UserModel = {
  // Function to get followers of a user
async getFollowers(userId: string) {
  const { data: followers, error } = await supabase
    .from('follows')
    .select('follower_id, profiles(username)')
    .eq('following_id', userId)
    .join('profiles', 'follower_id', 'profiles.id');

  if (error) {
    console.error("Error fetching followers:", error);
    throw error;
  }

  return followers;
},

// Function to get followings of a user
async getFollowings(userId: string) {
  const { data: followings, error } = await supabase
    .from('follows')
    .select('following_id, profiles(username)')
    .eq('follower_id', userId)
    .join('profiles', 'following_id', 'profiles.id');

  if (error) {
    console.error("Error fetching followings:", error);
    throw error;
  }

  return followings;
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
