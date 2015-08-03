import Ember from "ember";
import MessagingMixin from "app/mixins/messaging";

import { test } from "ember-qunit";
import { module } from "qunit";

var mockObject;
function sut(){
  return mockObject.create({
    socket: {
      subscribe: sinon.spy()
    },
    _events: {
      "{sample.channel} topic.{model.id}.event1": "event1Handler",
      "{sample.channel} topic.{model.id}.event2": "event2Handler"
    },
    _eventHandlers: {
      handler: sinon.spy()
    }
  });
}

module("MessagingMixin", {
  beforeEach: function(){
    mockObject = Ember.Object.extend(MessagingMixin, {
      eventParsing: {
        parse: sinon.stub().returns({
          channel: sinon.spy()
        })
      }
    });
  }
});

test("On Init", (assert)=> {
  //It Subscribes to Messages
  mockObject.reopen({
    subscribeToMessages: sinon.spy()
  });
  var instance = sut();

  assert.ok(instance.subscribeToMessages.calledOnce, "Subscribed");
  assert.ok(instance._subscriptions);
});

test("subscribeToMessages", (assert)=> {
  //Subscribe Events to Messages
  var instance = sut();
  instance.eventParsing = {
    parse: sinon.stub().returns({
      channel: sinon.spy()
    })
  };
  instance.socket = {
    subscribe: sinon.spy()
  };
  instance.subscribeToMessages();

  var event_data = instance.get("eventParsing.parse");
  assert.ok(event_data.calledTwice, "Both Events Parsed");
  assert.ok(instance.get("socket.subscribe").calledTwice);
});

test("eventHandler", (assert)=> {
  //Message Action Matches the Event Data Action
  mockObject.reopen({
    _handleEventInScope: sinon.spy() 
  });

  var event_data = {action: "ze_action"};
  var message = {meta: {action: "ze_action"}};

  var instance = sut();
  instance._eventHandler(event_data, message);

  assert.ok(instance._handleEventInScope.called, "Event is handled");
  
  //Message Action Does not Match the Data Action
  mockObject.reopen({
    _handleEventInScope: sinon.spy() 
  });

  event_data = {action: "ze_action"};
  message = {meta: {action: "other_action"}};

  instance = sut();
  instance._eventHandler(event_data, message);

  assert.ok(!instance._handleEventInScope.called, "Event Not Handled");
});

test("_handleEventInScope", (assert)=> {
  //With Matching Types and Identifiers
  var event_data = {
    type: "foostype",
    identifier: 1
  };
  var message = {meta: {
    type: "foostype",
    identifier: 1
  }};

  var instance = sut();
  var callback = sinon.spy();
  instance._handleEventInScope(event_data, message, callback);

  assert.ok(callback.called, "Callback was called");

  //With No Type and Matching Identifier
  event_data = { identifier: 1 };
  message = {meta: {
    identifier: 1
  }};

  instance = sut();
  callback = sinon.spy();
  instance._handleEventInScope(event_data, message, callback);

  assert.ok(callback.called, "Callback was called");
  
  //With No Type and wildcard identifier
  event_data = { identifier: "*" };
  message = {meta: {
    identifier: "*"
  }};

  instance = sut();
  callback = sinon.spy();
  instance._handleEventInScope(event_data, message, callback);

  assert.ok(callback.called, "Callback was called");

  //With Non-matching Types
  event_data = { 
    type: "type2",
    identifier: 1
  };
  message = {meta: {
    type: "type1",
    identifier: 1
  }};

  instance = sut();
  callback = sinon.spy();
  instance._handleEventInScope(event_data, message, callback);

  assert.ok(!callback.called, "Callback was not called");

  //With No Type and non matching identifier
  event_data = { identifier: 1 };
  message = {meta: {
    identifier: 2
  }};

  instance = sut();
  callback = sinon.spy();
  instance._handleEventInScope(event_data, message, callback);

  assert.ok(!callback.called, "Callback was not called");
});

test("publish", (assert)=> {
  mockObject.reopen({
    _meta: {}
  });

  var instance = sut();
  instance.socket = {
    publish: sinon.spy()
  };
  var socket = instance.get("socket");
  instance.publish("do_something");

  assert.ok(socket.publish.calledWith(instance._meta));
  assert.equal(instance._meta.action, "do_something");
});
