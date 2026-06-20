/**
 * @typedef {Object} ModelSlot
 * @property {string} provider
 * @property {string} model
 */

/**
 * @typedef {Object} CanonicalMessage
 * @property {'system'|'user'|'assistant'|'tool'} role
 * @property {string} content
 * @property {string} [toolCallId]
 * @property {string} [toolName]
 * @property {Array<{id:string,name:string,arguments:object}>} [toolCalls]
 */

/**
 * @typedef {Object} ToolCall
 * @property {string} id
 * @property {string} name
 * @property {object} arguments
 */

/**
 * @typedef {Object} CompletionResult
 * @property {string|null} text
 * @property {ToolCall[]} toolCalls
 * @property {CanonicalMessage} assistantMessage
 */

module.exports = {};
