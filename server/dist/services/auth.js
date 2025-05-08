//import type { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { GraphQLError } from 'graphql';
import dotenv from 'dotenv';
dotenv.config();
// interface JwtPayload {
//   _id: unknown;
//   username: string;
//   email: string,
// }
export const authenticateToken = ({ req }) => {
    let token = req.body.token || req.query.token || req.headers['x-access-token'];
    if (req.headers.authorization) {
        token = token.split('').pop().trim();
    }
    ;
    if (!token) {
        return req;
    }
    try {
        const { data } = jwt.verify(token, process.env.JWT_SECRET_KEY || '');
        req.user = data;
    }
    catch (err) {
        console.log('invalid token');
    }
    return req;
};
export const signToken = (username, email, _id) => {
    const payload = { username, email, _id };
    const secretKey = process.env.JWT_SECRET_KEY;
    return jwt.sign({ data: payload }, secretKey, { expiresIn: '2h' });
};
export class AuthenticationError extends GraphQLError {
    constructor(message) {
        super(message, undefined, undefined, undefined, ['UNAUTHENTICATED']);
        Object.defineProperty(this, 'name', { value: 'AuthenticationError' });
    }
}
;
