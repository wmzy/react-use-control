module.exports = {
  extension: ['js', 'ts', 'tsx'],
  recursive: true,
  exclude: ['mock', 'typings', 'fixtures', 'test/register.js', 'test/type.ts'],
  require: ['@babel/register', 'should', 'should-sinon', 'test/register.js']
}
