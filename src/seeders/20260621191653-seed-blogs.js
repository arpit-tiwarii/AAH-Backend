'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('blogs', [
      {
        title: 'Getting Started with Node.js',
        content: 'This is a sample blog post about Node.js and Express.',
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      },
      {
        title: 'Introduction to Sequelize',
        content: 'Sequelize is a promise-based ORM for Node.js applications.',
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      },
      {
        title: 'REST API Best Practices',
        content: 'Learn how to structure and secure your REST APIs effectively.',
        userId: 1,
        createdAt: new Date(),
        updatedAt: new Date(),
        deletedAt: null
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('blogs', {
      userId: 5
    });
  }
};
