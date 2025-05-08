import { AuthenticationError, UserInputError } from 'apollo-server-express';
import User from '../models/User';
import { sign } from 'jsonwebtoken';
const resolvers = {
    Query: {
        me: async (_, __, context) => {
            if (!context.user) {
                throw new AuthenticationError('Not logged in');
            }
            const userData = await User.findOne({ _id: context.user._id })
                .select('-__v -password')
                .populate('savedBooks');
            return userData;
        },
    },
    Mutation: {
        addUser: async (_, { username, email, password }) => {
            try {
                const user = await User.create({ username, email, password });
                const token = signToken(user);
                return { token, user };
            }
            catch (error) {
                if (error.code === 11000) {
                    throw new UserInputError('Email or username already exists');
                }
                throw error;
            }
        },
        login: async (_, { email, password }) => {
            const user = await User.findOne({ email });
            if (!user)
                throw new AuthenticationError('Incorrect credentials');
            const correctPw = await user.isCorrectPassword(password);
            if (!correctPw)
                throw new AuthenticationError('Incorrect credentials');
            const token = signToken(user);
            return { token, user };
        },
        saveBook: async (_, { bookData }, context) => {
            if (!context.user) {
                throw new AuthenticationError('You need to be logged in to save books!');
            }
            const updatedUser = await User.findByIdAndUpdate(context.user._id, { $addToSet: { savedBooks: bookData } }, { new: true, runValidators: true }).populate('savedBooks');
            return updatedUser;
        },
        removeBook: async (_, { bookId }, context) => {
            if (!context.user) {
                throw new AuthenticationError('You need to be logged in to remove books!');
            }
            const updatedUser = await User.findByIdAndUpdate(context.user._id, { $pull: { savedBooks: { bookId } } }, { new: true }).populate('savedBooks');
            return updatedUser;
        },
    },
};
export default resolvers;
// Typed and safer token generator
function signToken(user) {
    const payload = {
        _id: user._id,
        email: user.email,
        username: user.username,
    };
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET must be defined in environment variables.');
    }
    return sign(payload, secret, { expiresIn: '2h' });
}
