const expect = require('chai').expect;
const fs = require('fs');
const path = require("path");
const parser = require('../lib/parser');
const { ParserError } = require('../lib/errors');

const invalidYAML = 'invalid'
const inputYAML = fs.readFileSync(path.resolve(__dirname, "./asyncapi.yaml"), 'utf8');
const outputJSON = '{"asyncapi":"2.0.0-rc1","channels":{"mychannel":{"publish":{"message":{"payload":{"properties":{"name":{"type":"string"}},"type":"object"}}}}},"components":{"messages":{"testMessage":{"payload":{"properties":{"name":{"type":"string"}},"type":"object"}}},"schemas":{"testSchema":{"properties":{"name":{"type":"string"}},"type":"object"}}},"id":"urn:myapi","info":{"title":"My API","version":"1.0.0"}}';

describe('parse()', function () {
  it('should parse yaml', function () {
    const result = parser.parse(inputYAML);
    expect(JSON.stringify(result)).to.equal(outputJSON);
  });
  
  it('should throw error if document is invalid YAML', function () {
    const testFn = () => parser.parse(invalidYAML);
    expect(testFn)
      .to.throw(ParserError, '[Invalid AsyncAPI document]\n\n(root): Invalid type. Expected: object, given: string')
      .with.property('errors').to.have.members([
        '(root): Invalid type. Expected: object, given: string'
      ]);
  });
});