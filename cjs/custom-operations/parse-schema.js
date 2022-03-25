"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseSchemasV2 = void 0;
const jsonpath_plus_1 = require("jsonpath-plus");
const constants_1 = require("../constants");
const schema_parser_1 = require("../schema-parser");
const customSchemasPathsV2 = [
    // operations
    '$.channels.*.[publish,subscribe].message',
    '$.channels.*.[publish,subscribe].message.oneOf.*',
    '$.components.channels.*.[publish,subscribe].message',
    '$.components.channels.*.[publish,subscribe].message.oneOf.*',
    // messages
    '$.components.messages.*',
];
function parseSchemasV2(parser, detailed) {
    return __awaiter(this, void 0, void 0, function* () {
        const defaultSchemaFormat = (0, schema_parser_1.getDefaultSchemaFormat)(detailed.semver.version);
        const parseItems = [];
        const visited = new Set();
        customSchemasPathsV2.forEach(path => {
            (0, jsonpath_plus_1.JSONPath)({
                path,
                json: detailed.parsed,
                resultType: 'all',
                callback(result) {
                    const value = result.value;
                    if (visited.has(value)) {
                        return;
                    }
                    visited.add(value);
                    const payload = value.payload;
                    if (!payload) {
                        return;
                    }
                    const schemaFormat = (0, schema_parser_1.getSchemaFormat)(value.schemaFormat, detailed.semver.version);
                    parseItems.push({
                        input: {
                            asyncapi: detailed,
                            data: payload,
                            meta: {
                                message: value,
                            },
                            path: [...splitPath(result.path), 'payload'],
                            schemaFormat,
                            defaultSchemaFormat,
                        },
                        value,
                    });
                },
            });
        });
        return Promise.all(parseItems.map(item => parseSchemaV2(parser, item)));
    });
}
exports.parseSchemasV2 = parseSchemasV2;
function parseSchemaV2(parser, item) {
    return __awaiter(this, void 0, void 0, function* () {
        const originalData = item.input.data;
        const parsedData = item.value.payload = yield (0, schema_parser_1.parseSchema)(parser, item.input);
        // save original payload only when data is different (returned by custom parsers)
        if (originalData !== parsedData) {
            item.value[constants_1.xParserOriginalPayload] = originalData;
        }
    });
}
function splitPath(path) {
    // remove $[' from beginning and '] at the end and split by ']['
    return path.slice(3).slice(0, -2).split('\'][\'');
}