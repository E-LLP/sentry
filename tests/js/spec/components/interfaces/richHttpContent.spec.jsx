import React from "react/addons";
var TestUtils = React.addons.TestUtils;
import stubReactComponents from "../../../helpers/stubReactComponent";

import RichHttpContent from "app/components/interfaces/richHttpContent";
import DefinitionList from "app/components/interfaces/definitionList";
import ClippedBox from "app/components/clippedBox";
import ContextData from "app/components/contextData";

describe("RichHttpContent", function () {
  beforeEach(function () {
    this.data = {
      query: '',
      data: '',
      headers: [],
      cookies: [],
      env: {}
    };
    this.elem = TestUtils.renderIntoDocument(<RichHttpContent data={this.data} />);
    this.sandbox = sinon.sandbox.create();
    stubReactComponents(this.sandbox, [ClippedBox, DefinitionList, ContextData]);
  });

  afterEach(function () {
    this.sandbox.restore();
  });

  describe("objectToTupleArray", function () {
    it("should convert a key/value object to an array of key/value tuples", function () {
      let elem = this.elem;
      expect(elem.objectToTupleArray({
        foo: 'bar',
        bar: 'baz'
      })).to.eql([
        ['foo', 'bar'], ['bar', 'baz']
      ]);

      expect(elem.objectToTupleArray({
        foo: ['bar', 'baz']
      })).to.eql([
        ['foo', 'bar'], ['foo', 'baz']
      ]);

      expect(elem.objectToTupleArray({
        foo: ''
      })).to.eql([
        ['foo', '']
      ]);
    });
  });

  describe("getBodySection", function () {
    it("should return plain-text when unrecognized Content-Type", function () {
      let out = this.elem.getBodySection({
        headers: [], // no content-type header,
        data: 'helloworld'
      });

      expect(out.type).to.eql('pre');
    });

    it("should return a DefinitionList element when Content-Type is application/x-www-form-urlencoded", function () {
      var out = this.elem.getBodySection({
        headers: [
          ['lol' , 'no'],
          ['Content-Type', 'application/x-www-form-urlencoded']
        ], // no content-type header,
        data: "foo=bar&bar=baz"
      });

      // NOTE: ContextData is stubbed in tests; instead returns <div className="ContextData"/>
      expect(out.props.className).to.eql('DefinitionList');
      expect(out.props.data).to.eql([
        ['foo', 'bar'],
        ['bar', 'baz']
      ]);
    });

    it("should return a ContextData element when Content-Type is application/json", function () {
      var out = this.elem.getBodySection({
        headers: [
          ['lol' , 'no'],
          ['Content-Type', 'application/json']
        ], // no content-type header,
        data: JSON.stringify({foo: 'bar'})
      });

      // NOTE: ContextData is stubbed in tests; instead returns <div className="ContextData"/>
      expect(out.props.className).to.eql('ContextData');
      expect(out.props.data).to.eql({
        foo: 'bar'
      });
    });

    it("should return plain-text when JSON is not parseable", function () {
      let out = this.elem.getBodySection({
        headers: [
          ['lol' , 'no'],
          ['Content-Type', 'application/json']
        ],
        data: 'lol not json'
      });

      expect(out.type).to.eql('pre');
    });
  });
});
