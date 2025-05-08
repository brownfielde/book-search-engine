import { AuthenticationError, UserInputError } from 'apollo-server-express';
import User, { UserDocument } from '../models/User';
import { sign } from 'jsonwebtoken';

// Define types
interface AuthPayload {
    token: string;
    user: UserDocument;
}

interface Context {
    user?: {
        _id: string;
        email: string;
        username: string;
    };
}

interface BookInput {
    bookId: string;
    title?: string;
    authors?: string[];
    description?: string;
    image?: string;
    link?: string;
}

const resolvers = {
    Query: {
        me: async (_: unknown, __: unknown, context: Context) => {
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
        addUser: async (
            _: unknown,
            { username, email, password }: { username: string; email: string; password: string }
        ): Promise<AuthPayload> => {
            try {
                const user = await User.create({ username, email, password });
                const token = signToken(user);
                return { token, user };
            } catch (error: any) {
                if (error.code === 11000) {
                    throw new UserInputError('Email or username already exists');
                }
                throw error;
            }
        },

        login: async (
            _: unknown,
            { email, password }: { email: string; password: string }
        ): Promise<AuthPayload> => {
            const user = await User.findOne({ email });
            if (!user) throw new AuthenticationError('Incorrect credentials');

            const correctPw = await user.isCorrectPassword(password);
            if (!correctPw) throw new AuthenticationError('Incorrect credentials');

            const token = signToken(user);
            return { token, user };
        },

        saveBook: async (
            _: unknown,
            { bookData }: { bookData: BookInput },
            context: Context
        ) => {
            if (!context.user) {
                throw new AuthenticationError('You need to be logged in to save books!');
            }

            const updatedUser = await User.findByIdAndUpdate(
                context.user._id,
                { $addToSet: { savedBooks: bookData } },
                { new: true, runValidators: true }
            ).populate('savedBooks');

            return updatedUser;
        },

        removeBook: async (
            _: unknown,
            { bookId }: { bookId: string },
            context: Context
        ) => {
            if (!context.user) {
                throw new AuthenticationError('You need to be logged in to remove books!');
            }

            const updatedUser = await User.findByIdAndUpdate(
                context.user._id,
                { $pull: { savedBooks: { bookId } } },
                { new: true }
            ).populate('savedBooks');

            return updatedUser;
        },
    },
};

export default resolvers;

// Typed and safer token generator
function signToken(user: Pick<UserDocument, '_id' | 'email' | 'username'>): string {
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
