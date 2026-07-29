import * as usersService from '../services/users.service.js';

const getProfile = async (req, res, next) => {
  try {
    const { user, isFollowing } = await usersService.getProfile(req.params.id, req.user?._id);
    res.json({ success: true, user, isFollowing });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  try {
    const user = await usersService.updateProfile(req.user._id, req.user.username, req.body, req.file);
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};

const followUser = async (req, res, next) => {
  try {
    const io = req.app.get('io');
    await usersService.followUser(req.params.id, req.user._id, req.user.username, io);
    res.json({ success: true, message: 'Followed successfully' });
  } catch (error) {
    next(error);
  }
};

const unfollowUser = async (req, res, next) => {
  try {
    await usersService.unfollowUser(req.params.id, req.user._id);
    res.json({ success: true, message: 'Unfollowed successfully' });
  } catch (error) {
    next(error);
  }
};

const getFollowers = async (req, res, next) => {
  try {
    const followers = await usersService.getFollowers(req.params.id);
    res.json({ success: true, followers });
  } catch (error) {
    next(error);
  }
};

const getFollowing = async (req, res, next) => {
  try {
    const following = await usersService.getFollowing(req.params.id);
    res.json({ success: true, following });
  } catch (error) {
    next(error);
  }
};

const checkUsername = async (req, res, next) => {
  try {
    const available = await usersService.checkUsername(req.query.username, req.user?._id);
    res.json({ success: true, available });
  } catch (error) {
    next(error);
  }
};

export { getProfile, updateProfile, followUser, unfollowUser, getFollowers, getFollowing, checkUsername };
