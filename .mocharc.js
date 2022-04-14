module.exports = {
  extension: ['js', 'ts', 'tsx'],
  recursive: true,
  exclude: ['mock', 'typings', 'fixtures', 'test/register.js'],
  require: ['@babel/register', 'should', 'should-sinon', 'test/register.js']
}
