const setData = require("../data/setData");
const themeData = require("../data/themeData");
const path = require('path');
const env = require('dotenv').config({ path: `${__dirname}/../.env` })
const Sequelize = require('sequelize');

const sequelize = new Sequelize(process.env.DB_DATABASE, process.env.DB_USER, process.env.DB_PASSWORD, {
    host: process.env.DB_HOST,
    dialect: 'postgres',
    port: 5432,
    dialectOptions: {
      ssl: { rejectUnauthorized: false },
    },
  });
  
 // sequelize
 //  .authenticate()
 //  .then(() => {
 //     console.log('Connection has been established successfully.');
 //   })
 //   .catch((err) => {
 //   console.log('Unable to connect to the database:', err);
 //   });

const Theme = sequelize.define(
    'Theme',
    {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true, 
        autoIncrement: true, 
      },
      name: Sequelize.STRING,
    },
    {
      createdAt: false, // disable createdAt
      updatedAt: false, // disable updatedAt
    }
  );

  const Set = sequelize.define(
    'Set',
    {
      set_num: {
        type: Sequelize.STRING,
        primaryKey: true, 
      },
      name: Sequelize.STRING,
      year: Sequelize.INTEGER,
      num_parts: Sequelize.INTEGER,
      theme_id: Sequelize.INTEGER,
      img_url: Sequelize.STRING,

    },
    {
      createdAt: false, // disable createdAt
      updatedAt: false, // disable updatedAt
    }
  );

  Set.belongsTo(Theme, {foreignKey: 'theme_id'});

// let sets =  [];

function initialize() {
    return new Promise((resolve, reject) => {
        try {
            sequelize.sync();
            resolve(); 
        } catch (error) {
            reject(error);  
        }
    });
}

function getAllSets() {
  return new Promise((resolve, reject) => {
    Set.findAll({
      include: [Theme]
    }).then((sets) => {
      resolve(sets);
    }).catch((error) => {
      reject(new Error("Sets array is empty. Initialize the data first."));
    });
  });
}

function getSetByNum(setNum) {
    return new Promise((resolve, reject) => {
      Set.findAll({
        include: [Theme],
        where: {
          set_num: setNum,
        },
      }).then((sets) => {
        if (sets.length === 0) {
          reject(new Error("Unable to find requested set"));
        } else {
          resolve(sets[0]);
        }
      }).catch((error) => {
        reject(error);
      });
    });
  }

  function getSetsByTheme(theme) {
    return new Promise((resolve, reject) => {
      Set.findAll({
        include: [Theme],
        where: {
          '$Theme.name$': {
            [Sequelize.Op.iLike]: `%${theme}%`
          }
        }
      }).then((sets) => {
        if (sets.length === 0) {
          reject(new Error("Unable to find requested sets"));
        } else {
          resolve(sets);
        }
      }).catch((error) => {
        reject(error);
      });
    });
  }

  function addSet(setData) {
    return new Promise((resolve, reject) => {
        Set.create(setData)
            .then(() => {
                resolve();
            })
            .catch(err => {
                reject(err.errors[0].message);
            });
    });
  }

  function getAllThemes() {
    return new Promise((resolve, reject) => {
        Theme.findAll()
            .then(themes => {
                resolve(themes);
            })
            .catch(err => {
                reject(err.message);
            });
    });
}

function editSet(set_num, setData) {
  return new Promise((resolve, reject) => {
      Set.update(setData, {
          where: {
              set_num: set_num
          }
      })
      .then((result) => {
          if (result[0] === 0) {
              reject(new Error('Set not found or no changes made'));
          } else {
              resolve();
          }
      })
      .catch((err) => {
          reject(new Error(err.errors[0].message));
      });
  });
}

function deleteSet(set_num) {
  return new Promise((resolve, reject) => {
      Set.destroy({ where: { set_num } })
          .then(() => resolve())
          .catch(err => reject(err.errors[0].message));
  });
}

module.exports = { initialize, getAllSets, getSetByNum, getSetsByTheme, addSet, getAllThemes, editSet, deleteSet};
// sequelize
// .sync()
// .then( async () => {
//   try{
//     await Theme.bulkCreate(themeData);
//     await Set.bulkCreate(setData); 
//     console.log("-----");
//     console.log("data inserted successfully");
//   }catch(err){
//     console.log("-----");
//     console.log(err.message);

//     // NOTE: If you receive the error:

//     // insert or update on table "Sets" violates foreign key constraint "Sets_theme_id_fkey"

//     // it is because you have a "set" in your collection that has a "theme_id" that does not exist in the "themeData".   

//     // To fix this, use PgAdmin to delete the newly created "Themes" and "Sets" tables, fix the error in your .json files and re-run this code
//   }

//   process.exit();
// })
// .catch((err) => {
//   console.log('Unable to connect to the database:', err);
// });