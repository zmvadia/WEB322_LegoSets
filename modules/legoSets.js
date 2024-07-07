const setData = require("../data/setData");
const themeData = require("../data/themeData")

let sets =  [];

function initialize() {
    return new Promise((resolve, reject) => {
        try {
            sets = [];
            setData.forEach(set => {
                const theme = themeData.find(theme => theme.id === set.theme_id);
                sets.push({
                    ...set,
                    theme: theme ? theme.name : "Unknown"
                });
            });
            resolve(); 
        } catch (error) {
            reject(error);  
        }
    });
}

function getAllSets() {
    return new Promise((resolve, reject) => {

        if (sets.length === 0) {
            reject(new Error("Sets array is empty. Initialize the data first."));
            return;
        }

        resolve(sets);
    });
}

function getSetByNum(setNum) {
    return new Promise((resolve, reject) => {

        const set = sets.find(set => set.set_num === setNum);

        if (!set) {
            reject(new Error("Set for that ID not found."));
            return;
        }

        resolve(set);
    });
}

function getSetsByTheme(theme) {
    return new Promise((resolve, reject) => {

        const themeLowerCase = theme.toLowerCase();
        const filteredSets = sets.filter(set => set.theme.toLowerCase().includes(themeLowerCase));

        if (filteredSets.length > 0) {
            resolve(filteredSets);
        } else {
            reject(new Error('sets for that theme not found'));
        }
    });
}

module.exports = { initialize, getAllSets, getSetByNum, getSetsByTheme };