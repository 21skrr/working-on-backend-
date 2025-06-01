const { SystemSetting } = require("../models");

const getSystemSetting = async (key) => {
    const setting = await SystemSetting.findOne({ where: { key } });
    if (!setting) return null;
  
    try {
      return typeof setting.value === "string"
        ? JSON.parse(setting.value)
        : setting.value;
    } catch {
      return setting.value;
    }
  };

const getMultipleSystemSettings = async (keys) => {
  const settings = await SystemSetting.findAll({ where: { key: keys } });
  const result = {};
  settings.forEach((s) => result[s.key] = s.value);
  return result;
};

module.exports = {
  getSystemSetting,
  getMultipleSystemSettings,
};
