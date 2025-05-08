import React from 'react';
import { Container, Card, Button, Row, Col } from 'react-bootstrap';
import { useQuery, useMutation } from '@apollo/client';

import { GET_ME } from '../utils/queries';
import { REMOVE_BOOK } from '../utils/mutations';
import Auth from '../utils/auth';
import { removeBookId } from '../utils/localStorage';
import type { User } from '../models/User';

interface BookItem {
  bookId: string;
  authors: string[];
  title: string;
  description: string;
  image: string;
  link: string;
}

const SavedBooks = () => {
  // Use the useQuery hook to execute the GET_ME query on load
  const { loading, data } = useQuery(GET_ME);
  
  // Use the useMutation hook to execute the REMOVE_BOOK mutation
  const [removeBook, { error }] = useMutation(REMOVE_BOOK, {
    // Update cache after a book is removed
    update(cache, { data: { removeBook } }) {
      // Update the ME query's cache with the returned user object
      cache.writeQuery({
        query: GET_ME,
        data: { me: removeBook },
      });
    },
  });

  // Extract user data if it exists
  const userData = data?.me || null;

  // Function to handle deleting a book from the database
  const handleDeleteBook = async (bookId: string) => {
    const token = Auth.loggedIn() ? Auth.getToken() : null;

    if (!token) {
      return false;
    }

    try {
      // Execute the removeBook mutation
      await removeBook({
        variables: { bookId },
      });

      // Upon success, remove book's id from localStorage
      removeBookId(bookId);
    } catch (err) {
      console.error(err);
    }
  };

  // If data isn't here yet, say so
  if (loading) {
    return <h2>LOADING...</h2>;
  }

  // If user isn't logged in, redirect to the homepage
  if (!Auth.loggedIn()) {
    return window.location.assign('/') as unknown as JSX.Element;
  }

  return (
    <>
      <div className="text-light bg-dark p-5">
        <Container>
          {userData?.username ? (
            <h1>Viewing {userData.username}'s saved books!</h1>
          ) : (
            <h1>Viewing saved books!</h1>
          )}
        </Container>
      </div>
      <Container>
        <h2 className='pt-5'>
          {userData?.savedBooks?.length
            ? `Viewing ${userData.savedBooks.length} saved ${userData.savedBooks.length === 1 ? 'book' : 'books'}:`
            : 'You have no saved books!'}
        </h2>
        <Row>
          {userData?.savedBooks?.map((book: BookItem) => {
            return (
              <Col md="4" key={book.bookId}>
                <Card border='dark'>
                  {book.image ? <Card.Img src={book.image} alt={`The cover for ${book.title}`} variant='top' /> : null}
                  <Card.Body>
                    <Card.Title>{book.title}</Card.Title>
                    <p className='small'>Authors: {book.authors?.join(', ')}</p>
                    <Card.Text>{book.description}</Card.Text>
                    <Button className='btn-block btn-danger' onClick={() => handleDeleteBook(book.bookId)}>
                      Delete this Book!
                    </Button>
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Container>
    </>
  );
};

export default SavedBooks;
