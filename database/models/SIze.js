module.exports = (sequelize, dataTypes) => {
  const alias = 'sizes';
  const cols = {
    id: {
      type: dataTypes.INTEGER,
      primaryKey: true,
      autoIncrement: true
    },
    size: {
      type: dataTypes.STRING,
      allowNull: false
    }
  };
  const config = {
    timestamps: false,
    tableName: 'size'
  };
  const Size = sequelize.define(alias, cols, config);
  return Size;
};