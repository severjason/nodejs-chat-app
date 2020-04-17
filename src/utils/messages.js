const generateMessage = (text, username = 'Admin') => ({
  username,
  text,
  createdAt: new Date().getTime(),
});

module.exports = {
  generateMessage,
};
