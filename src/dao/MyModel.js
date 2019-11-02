'use strict';

module.exports = {
  /**
   * @description Retrieves Object with given ID
   * @param {Number} id - Object ID to retrieve
   * @param {Object} request - Hapi Request interface
   * @return {Promise}
   */
  findById: async (id, request) => {
    const connection = request.app.db.connection;
    const sql = 'SELECT `id`, `description` FROM MyModel WHERE `id` = ?';
    const [results] = await connection.execute(sql, [id]);
    return results.length > 0 ? results[0] : null;
  },

  /**
  * @description Creates a new object with given data
  * @param {Object} myModel - Object representing the new object
  * @param {Object} request - Hapi Request interface
  * @return {Promise}
  */
  create: async (myModel, request) => {
    const connection = request.app.db.connection;
    const sql = 'INSERT INTO MyModel (`description`) VALUES (?)';
    const [results] = await connection.execute(sql, [myModel.description]);
    return results.insertId;
  },
};
