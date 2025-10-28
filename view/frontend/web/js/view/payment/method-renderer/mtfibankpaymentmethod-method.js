/**
 * Copyright © 2015 Magento. All rights reserved.
 * See COPYING.txt for license details.
 */
/*browser:true*/
/*global define*/
define(['jquery', 'Magento_Checkout/js/view/payment/default', 'ko'], function (
  $,
  Component,
  ko
) {
  'use strict';

  var self;

  return Component.extend({
    defaults: {
      redirectAfterPlaceOrder: false,
      template: 'Avalon_Mtfibankpayment/payment/mtfibankpaymentmethod',
    },

    /** Returns send check to info */
    getMailingAddress: function () {
      return window.checkoutConfig.payment.checkmo.mailingAddress;
    },

    fibankloading: ko.observable(true),
    fibankStatus: ko.observable(''),

    initialize: function () {
      self = this;
      this._super();
      this.getCheckoutFibank();

      // Auto-select this payment method if URL parameter or sessionStorage is present
      var urlParams = new URLSearchParams(window.location.search);
      var autoSelectPaymentMethod = sessionStorage.getItem(
        'autoSelectPaymentMethod'
      );

      if (
        urlParams.get('payment_method') === 'mtfibankpaymentmethod' ||
        autoSelectPaymentMethod === 'mtfibankpaymentmethod'
      ) {
        setTimeout(() => {
          this.selectPaymentMethod();
          // Clear the sessionStorage after using it
          sessionStorage.removeItem('autoSelectPaymentMethod');
        }, 500);
      }
    },

    getFibankStatus: function () {
      if (self.fibankStatus() == 'Yes') {
        return true;
      } else {
        return false;
      }
    },

    getCheckoutFibank: function () {
      self.fibankloading(true);
      $.ajax({
        url: '/mtfibankpayment/index/fibankgetcheckout',
        type: 'post',
        dataType: 'json',
        data: {},
        success: function (json) {
          self.fibankStatus(json['fibank_status']);
          self.fibankloading(false);
        },
      });
    },

    getOrderId: function () {
      var _url = '/mtfibankpayment/index/fibankgetid?tag=jLhrHYsfPQ3Gu9JgJPLJ';
      var param = 'ajax=1';
      jQuery
        .ajax({
          showLoader: true,
          url: _url,
          data: param,
          type: 'POST',
          dataType: 'json',
        })
        .done(function (data) {
          if (parseInt(data.msg_status) == 1) {
            if (parseInt(data.fibank_send_mail) == 1) {
              alert(
                'Има временен проблем с комуникацията към Fibank. Изпратен е мейл с Вашата заявка към Банката. Моля очаквайте обратна връзка от Банката за да продължите процедурата по вашата заявка за кредит.'
              );
              return;
            } else {
              var fibankreturn = data.fibankreturn;
              window.location = fibankreturn;
              return;
            }
          } else {
            alert('Error get data!');
          }
        })
        .fail(function (XMLHttpRequest, textStatus, errorThrown) {
          alert('Error get data!');
        });
    },

    afterPlaceOrder: function () {
      this.getOrderId();
    },
  });
});
