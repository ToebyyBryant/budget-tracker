'use strict';

module.exports = (sequelize, DataTypes) => {
  const Category = sequelize.define(
    'Category',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      is_default: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      tableName: 'categories',
      underscored: true,
      timestamps: true,
      updatedAt: false, // only createdAt per spec
      indexes: [
        {
          unique: true,
          fields: ['name', 'user_id'],
          name: 'categories_name_user_id_unique',
        },
      ],
    }
  );

  return Category;
};
