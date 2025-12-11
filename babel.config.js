module.exports = function(api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // plugins satırını sildik, animasyonu sonra ekleriz
  };
};