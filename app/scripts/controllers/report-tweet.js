'use strict';
/* jshint camelcase: false */

angular.module('citizendeskFrontendApp')
  .controller('ReportTweetCtrl', function ($scope, $routeParams, Raven, api, $location, Coverages, Report, linkTweetEntities, Bacon, $q) {
    var id = $routeParams.id,
        properties = {
          coveragesData: Bacon.constant(Coverages.promise)
        },
        streams = {
          updateReport: new Bacon.Bus()
        };
    properties.coveragesData.onValue(function(promise){
      promise.then(function(coverages) { $scope.coverages = coverages; });
    });
    streams.reportData = streams.updateReport.map(function() {
      return api.reports.getById(id);
    });
    streams.reportData.onValue(function(promise) {
      return promise.then(function(report){
        addSteps(report); // idempotent
        $scope.isPublished = Report.checkPublished(report);
        $scope.report = report;
        $scope.linkedText = linkTweetEntities(report);
        if (report.on_behalf_id) {
          api.users.getById(report.on_behalf_id)
            .then(function(user) {
              $scope.onBehalf = user;
            });
        }
      });
    });
    streams.reportData.take(1).onValue(function(promise){
        promise.then(function(){
          $scope.$watch(
            'report.verified',
            Report.getVerificationHandler($scope)
          );
        });
      });

    Bacon
      .combineAsArray(streams.reportData, properties.coveragesData)
      .onValue(function(value) {
        var reportPromise = value[0],
            coveragesPromise = value[1];
        $q.all([reportPromise, coveragesPromise])
          .then(function(results){
            var report = results[0],
                coverages = results[1];
            $scope.selectedCoverage = Report
              .getSelectedCoverage(report, coverages);
          });
      });

    function addSteps(report) {
      if (!('steps' in report)) {
        api.steps.query()
          .then(function(response) {
            var data = response._items;
            if (data.length === 0) {
              Raven.raven.captureMessage('no validation steps for report detail');
            } else {
              report.steps = data.map(function(step) {
                step.done = false;
                return step;
              });
            }
          });
      }
    }

    $scope.save = function() {
      $scope.status = 'info';
      $scope.alert = 'saving';

      api.reports.save($scope.report)
        .then(function () {
          $scope.status = 'success';
          $scope.alert = 'saved';
        })
        .catch(function () {
          $scope.status = 'danger';
          $scope.alert = 'error';
        });
    };

    $scope.changeStep = function(checking) {
      if (!checking) {
        alert('A validation step should never be unchecked, if you are unchecking now this means that the validation process was poor. Please be sure to avoid this in the future');
      }
      $scope.save();
    };

    $scope.publish = function() {
      $scope.disablePublish = true;
      Report
        .publish($scope.report, $scope.selectedCoverage)
        .then(function() {
          streams.updateReport.push('start');
          $scope.disablePublish = false;
      });
    };

    $scope.unpublish = function() {
      $scope.disablePublish = true;
      Report
        .unpublish($scope.report, $scope.selectedCoverage)
        .then(function() {
          streams.updateReport.push('start');
          $scope.disablePublish = false;
        });
    };

    streams.updateReport.push('start');
  });
