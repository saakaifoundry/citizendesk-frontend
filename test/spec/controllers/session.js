'use strict';

/* this is a report session, do not confuse with an authentication session */

describe('Controller: SessionCtrl', function () {

  // load the controller's module
  beforeEach(module('citizendeskFrontendApp'));

  var SessionCtrl,
      scope,
      $httpBackend;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope, _$httpBackend_) {
    $httpBackend = _$httpBackend_;
    scope = $rootScope.$new();
    $httpBackend
      .expectGET(globals.root)
      .respond(mocks.root);
    $httpBackend
      .expectGET(globals.root + 'reports?embedded=%7B%22user_id%22:1%7D&page=1&sort=%5B(%22produced%22,+1)%5D&where=%7B%22session%22:%22test-session-id%22%7D')
      .respond(mocks.reports['list-not-paginated-session']);
    SessionCtrl = $controller('SessionCtrl', {
      $scope: scope,
      $routeParams: {
        session: 'test-session-id'
      },
      session: {
        identity: {
          user: 'test-user-id'
        }
      },
      now: function() {
        return 'now';
      }
    });
    $httpBackend.flush();
  }));

  it('gets the reports in the session', function() {
    expect(scope.reports.length).toBe(6);
  });
  it('finds the last report to use for reply', function() {
    /* my humble opinion is that it is silly and unsafe to have this
     logic on the client side, and that it should be possible to send
     replies using the session id instead of a report id */
    scope.$digest();
    expect(scope.replyReport._id).toBe('53bd65389c61672e3d00000c');
  });

  describe('when a reply is sent', function() {
    beforeEach(function() {
      $httpBackend
        .expectPOST(globals.root + 'proxy/mobile-reply/', {
          "report_id":"test-report-id"
          ,"message":"Please, tell us where you are!"
          ,"sensitive":false
          ,"language":"en"
        })
        .respond(200);
      var reports = angular
            .copy(mocks.reports['list-not-paginated-session']);
      reports._items.push({id_:'new report'});
      $httpBackend
        .expectGET(globals.root + 'reports?embedded=%7B%22user_id%22:1%7D&page=1&sort=%5B(%22produced%22,+1)%5D&where=%7B%22session%22:%22test-session-id%22%7D')
        .respond(reports);
      scope.sendReply({
        report_id: 'test-report-id',
        message: 'Please, tell us where you are!'
      });
      $httpBackend.flush();
    });
    it('adds the sent report to the session', function() {
      expect(scope.reports.length).toBe(7);
    });
    it('sends a message reply', function () {
      $httpBackend.verifyNoOutstandingRequest();
      $httpBackend.verifyNoOutstandingExpectation();
    });
  });
});
