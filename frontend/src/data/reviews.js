// Sample review data
const reviews = [
  {
    id: 1,
    productId: 1,
    user: {
      id: 101,
      name: 'Elman Ahmed',
      avatar: null
    },
    rating: 5,
    content: 'Excellent product. Was pleased with what I received. Would 100% recommend it!',
    images: ['/review-image-1.jpg', '/review-image-2.jpg', '/review-image-3.jpg', '/review-image-4.jpg'],
    createdAt: '2023-05-10T10:30:00Z'
  },
  {
    id: 2,
    productId: 2,
    user: {
      id: 102,
      name: 'Sarah Johnson',
      avatar: null
    },
    rating: 4,
    content: 'Great quality shirt! The material is soft and durable. Fits as expected.',
    images: ['/review-image-5.jpg'],
    createdAt: '2023-05-08T14:20:00Z'
  },
  {
    id: 3,
    productId: 3,
    user: {
      id: 103,
      name: 'Michael Brown',
      avatar: null
    },
    rating: 5,
    content: 'Amazing design and perfect fit! The colors are vibrant and it looks exactly like the pictures.',
    images: [],
    createdAt: '2023-05-05T09:15:00Z'
  },
  {
    id: 4,
    productId: 1,
    user: {
      id: 104,
      name: 'Lisa Chen',
      avatar: null
    },
    rating: 3,
    content: 'Decent shirt, but the sizing runs a bit small. Consider ordering one size up.',
    images: ['/review-image-6.jpg', '/review-image-7.jpg'],
    createdAt: '2023-05-02T16:45:00Z'
  },
  {
    id: 5,
    productId: 4,
    user: {
      id: 105,
      name: 'David Wilson',
      avatar: null
    },
    rating: 5,
    content: 'Absolutely love this! Fast shipping and the quality exceeds expectations.',
    images: ['/review-image-8.jpg'],
    createdAt: '2023-04-28T11:30:00Z'
  },
  {
    id: 6,
    productId: 2,
    user: {
      id: 106,
      name: 'Emma Garcia',
      avatar: null
    },
    rating: 4,
    content: 'Comfortable and stylish. Washed multiple times and still looks new.',
    images: [],
    createdAt: '2023-04-25T08:20:00Z'
  },
  {
    id: 7,
    productId: 5,
    user: {
      id: 107,
      name: 'James Taylor',
      avatar: null
    },
    rating: 5,
    content: 'Perfect for casual wear. Got many compliments on this. Will buy again!',
    images: ['/review-image-9.jpg', '/review-image-10.jpg'],
    createdAt: '2023-04-22T13:10:00Z'
  },
  {
    id: 8,
    productId: 3,
    user: {
      id: 108,
      name: 'Olivia Martin',
      avatar: null
    },
    rating: 3,
    content: 'Material quality is good, but the design is slightly different from what was shown.',
    images: ['/review-image-11.jpg'],
    createdAt: '2023-04-18T15:50:00Z'
  }
];

export default reviews; 