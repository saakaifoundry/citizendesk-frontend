'use strict';

describe('Controller: AssignedToMeCtrl', function () {

  // load the controller's module
  beforeEach(module('citizendeskFrontendApp'));

  var AssignedToMeCtrl,
      scope,
      $q,
      AliasesInLists = {
        embedAuthorAlias: function(report) {
          report.authors[0].alias = 'whatever';
        }
      },
      api;

  // Initialize the controller and a mock scope
  beforeEach(inject(function ($controller, $rootScope, _$q_, _api_) {
    $q = _$q_;
    scope = $rootScope.$new();
    api = _api_;
    spyOn(api.reports, 'query')
      .and.returnValue($q.when(angular.copy(mocks.reports['list-not-paginated'])));
    AssignedToMeCtrl = $controller('AssignedToMeCtrl', {
      $scope: scope,
      api: api,
      session: {
        identity: mocks.auth.success
      },
      AliasesInLists: AliasesInLists
    });
    scope.$digest();
  }));

  it('queries for the assigned reports list', function() {
    var query = api.reports.query.calls.mostRecent().args[0];
    expect(query.page).toBe(1);
    expect(query.sort).toBe('[("produced", -1)]');
  });
  xit('attaches reports to the scope', function () {
    // expect(reports[0]).not.toBeUndefined();
    // expect(scope.reports.length).toBe(1);
    // console.debug(scope);
  });
  xit('builds the linked text for every report', function(){
    expect(scope.reports[0].linkedText).toBeDefined();
  });
  xit('embeds author aliases', function() {
    expect(scope.reports[0].authors[0].alias).toBeDefined();
  });
  xit('dismisses a report', function() {
    var r = scope.reports[0];
    scope.dismiss(r);
    api.reports.def.update.resolve(r);
    scope.$digest();
    expect(scope.reports.length).toBe(0);
  });
});
