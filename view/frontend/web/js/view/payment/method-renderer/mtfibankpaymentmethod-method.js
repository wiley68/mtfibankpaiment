/**
 * Copyright © 2015 Magento. All rights reserved.
 * See COPYING.txt for license details.
 */
/*browser:true*/
/*global define*/
define([
  'jquery',
  'Magento_Checkout/js/view/payment/default',
  'ko',
  'Magento_Checkout/js/model/quote',
], function ($, Component, ko, quote) {
  'use strict';

  var self;

  return Component.extend({
    defaults: {
      redirectAfterPlaceOrder: false,
      template: 'Avalon_Mtfibankpayment/payment/mtfibankpaymentmethod',
    },

    /**
     * Returns mailing address for check payment method.
     * @returns {string|undefined} Mailing address or undefined if not available
     */
    getMailingAddress: function () {
      return window.checkoutConfig.payment.checkmo.mailingAddress;
    },

    /** @type {ko.Observable<boolean>} Loading state for Fibank payment method */
    fibankloading: ko.observable(true),

    /** @type {ko.Observable<string>} Fibank payment method status */
    fibankStatus: ko.observable(''),

    /** @type {ko.Observable<string>} URL of the desktop Fibank header image */
    fibankPicture: ko.observable(''),

    /** @type {ko.Observable<string>} URL of the mobile Fibank header image */
    fibankmPicture: ko.observable(''),

    /** @type {ko.Observable<string>} Primary currency sign (default: 'лв.') */
    fibankSign: ko.observable('лв.'),

    /** @type {ko.Observable<string>} Secondary currency sign (default: '€') */
    fibankSignSecond: ko.observable('€'),

    /** @type {ko.Observable<number>} Monthly installment amount in secondary currency */
    fibankVnoskaSecond: ko.observable(0),

    /** @type {ko.Observable<string>} Credit amount display text (may include dual currency) */
    fibankPrice: ko.observable(''),

    /** @type {ko.ObservableArray<{value: number, label: string}>} Available installment options (3-60 months) */
    fibankVnoskiOptions: ko.observableArray([]),

    /** @type {ko.Observable<number>} Currently selected number of installments (default: 12) */
    fibankSelectedVnoski: ko.observable(12),

    /** @type {ko.Observable<string>} Monthly installment amount display text (may include dual currency) */
    fibankVnoska: ko.observable(''),

    /** @type {ko.Observable<string>} Total payment amount display text (may include dual currency) */
    fibankObshtozaplashtane: ko.observable(''),

    /** @type {ko.Observable<string>} Annual Percentage Rate (APR) as percentage */
    fibankGlp: ko.observable(''),

    /** @type {ko.Observable<string>} Effective Annual Interest Rate (EIR) as percentage */
    fibankGpr: ko.observable(''),

    /**
     * Initialize the payment method component.
     * Sets up event handlers, initializes installment options, and handles auto-selection.
     */
    initialize: function () {
      self = this;
      this._super();
      this.getCheckoutFibank();

      // Initialize options with all possible values from 3 to 60
      var initialOptions = [];
      for (var i = 3; i <= 60; i++) {
        initialOptions.push({
          value: i,
          label: i + ' месеца',
        });
      }
      this.fibankVnoskiOptions(initialOptions);

      // Attach popup link handler once DOM is ready
      $(document).on('click', '#fibank-plans-link', function (e) {
        e.preventDefault();
        self.openFibankPopup();
      });

      // Close button in checkout popup
      $(document).on('click', '#fibank_back_credit', function () {
        var container = document.getElementById(
          'fibank-product-popup-container'
        );
        if (container) container.style.display = 'none';
      });

      // Expose handlers for select events (used in template)
      self.onVnoskiFocus = function (data, event) {
        window._fibank_old_vnoski = self.fibankSelectedVnoski();
      };

      self.onVnoskiChange = function (data, event) {
        self.updateInstallments();
      };

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

    /**
     * Retrieves a configuration value from checkoutConfig.
     * @param {string} key - Configuration key name
     * @returns {*} Configuration value or undefined if not found
     */
    getConfigValue: function (key) {
      var cfg =
        window.checkoutConfig &&
        window.checkoutConfig.payment &&
        window.checkoutConfig.payment.mtfibankpaymentmethod;
      return cfg ? cfg[key] : undefined;
    },

    /**
     * Gets the grand total from the quote.
     * @returns {number} Grand total amount or 0 if not available
     */
    getGrandTotal: function () {
      var totals = quote.getTotals() && quote.getTotals();
      return totals && totals()['grand_total']
        ? parseFloat(totals()['grand_total'])
        : 0;
    },

    /**
     * Calculates the normalized price based on EUR mode and currency code.
     * Applies currency conversion when necessary (BGN/EUR exchange rate: 1.95583).
     * @param {number|string} eurMode - EUR mode: 0 (no conversion), 1 (BGN to EUR), 2/3 (EUR to BGN)
     * @param {string} currencyCode - Current currency code ('BGN' or 'EUR')
     * @param {number|string} price - Original price to normalize
     * @returns {number} Normalized price value
     */
    calculatePrice: function (eurMode, currencyCode, price) {
      var p = parseFloat(price);
      var result = p;
      switch (parseInt(eurMode)) {
        case 0:
          result = p;
          break;
        case 1:
          if (currencyCode === 'EUR') {
            result = p * 1.95583;
          }
          break;
        case 2:
        case 3:
          if (currencyCode === 'BGN') {
            result = p / 1.95583;
          }
          break;
      }
      return result;
    },

    /**
     * Detects if the current user agent is a mobile device.
     * Uses comprehensive regex patterns to identify mobile browsers.
     * @returns {boolean} True if mobile device, false otherwise
     */
    isMobileUserAgent: function () {
      var ua = navigator.userAgent || '';
      var isMobile =
        /(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i.test(
          ua
        ) ||
        /1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i.test(
          ua.substr(0, 4)
        );
      return !!isMobile;
    },

    /**
     * Returns the appropriate Fibank header image URL based on device type.
     * @returns {string} Image URL for mobile or desktop
     */
    getFibankPicture: function () {
      if (this.isMobileUserAgent()) {
        return this.fibankmPicture();
      } else {
        return this.fibankPicture();
      }
    },

    /**
     * Gets the currency display text for installment amounts.
     * Returns single currency sign if secondary is 0, otherwise returns both signs separated by '/'.
     * @returns {string} Currency display text (e.g., 'лв.', 'лв./€', '€/лв.')
     */
    getCurrencyDisplayText: function () {
      var vnoskaSecond = this.fibankVnoskaSecond();
      var sign = this.fibankSign();
      var signSecond = this.fibankSignSecond();
      if (vnoskaSecond === 0 || vnoskaSecond === '0') {
        return sign;
      } else {
        return sign + '/' + signSecond;
      }
    },

    /**
     * Applies mobile or desktop CSS classes to the popup container elements.
     * Dynamically switches classes based on device type for responsive styling.
     * @param {boolean} isMobile - True if mobile device, false for desktop
     */
    applyMobileClasses: function (isMobile) {
      var container = document.getElementById('fibank-product-popup-container');
      if (!container) return;
      /**
       * Internal helper function to replace CSS classes.
       * @param {string} desktopCls - Desktop CSS class name
       * @param {string} mobileCls - Mobile CSS class name
       */
      var replace = function (desktopCls, mobileCls) {
        var elDesktop = container.querySelector('.' + desktopCls);
        var elMobile = container.querySelector('.' + mobileCls);
        if (isMobile && elDesktop) {
          elDesktop.classList.remove(desktopCls);
          elDesktop.classList.add(mobileCls);
        }
        if (!isMobile && elMobile) {
          elMobile.classList.remove(mobileCls);
          elMobile.classList.add(desktopCls);
        }
      };
      replace('fibank_PopUp_Detailed_v1', 'fibankm_PopUp_Detailed_v1');
      replace('fibank_Mask', 'fibankm_Mask');
      replace('fibank_product_name', 'fibankm_product_name');
      replace('fibank_body_panel_txt3', 'fibankm_body_panel_txt3');
      replace('fibank_body_panel_txt4', 'fibankm_body_panel_txt4');
      replace('fibank_body_panel_txt3_left', 'fibankm_body_panel_txt3_left');
      replace('fibank_body_panel_txt3_right', 'fibankm_body_panel_txt3_right');
      replace('fibank_body_panel_footer', 'fibankm_body_panel_footer');
      replace('fibank_body_panel_left', 'fibankm_body_panel_left');
      replace('fibank_kredit_panel', 'fibankm_kredit_panel');
      replace('fibank_kredit_panel_left', 'fibankm_kredit_panel_left');
      replace('fibank_sumi_panel', 'fibankm_sumi_panel');
      replace('fibank_header', 'fibankm_header');
    },

    /**
     * Opens the Fibank installment plans popup.
     * Fetches product data from server, validates price range, filters installment options
     * using BigInt bitmask operations, and displays the popup with calculated values.
     */
    openFibankPopup: function () {
      var eur = parseInt(this.getConfigValue('fibank_eur') || 0);
      var currencyCode = this.getConfigValue('currency_code') || 'BGN';
      var price = this.getGrandTotal();
      var normalized = this.calculatePrice(eur, currencyCode, price);

      var fibankCid = this.getConfigValue('fibank_cid') || '';
      var fibankLive = this.getConfigValue('fibank_live_url') || '';
      var fibankCats = this.getConfigValue('fibank_product_cats') || '0';

      var url =
        fibankLive +
        '/function/getproduct.php?cid=' +
        encodeURIComponent(fibankCid) +
        '&price=' +
        encodeURIComponent(normalized) +
        '&category_ids=' +
        encodeURIComponent(fibankCats);

      var selfRef = this;
      $.ajax({ url: url, type: 'GET', dataType: 'json' })
        .done(function (resp) {
          try {
            var status = parseInt(resp.fibank_status || 0);
            var min = parseFloat(resp.fibank_minstojnost || 0);
            var max = parseFloat(resp.fibank_maxstojnost || 0);
            // Convert directly from string to BigInt to preserve precision (without parseInt!)
            // resp.fibank_vnoski_visible comes as string "72057594037927881"
            var visibleMaskStr = String(resp.fibank_vnoski_visible || '0');
            var visibleMaskBigInt = BigInt(visibleMaskStr);
            var vnoskiDefault = parseInt(resp.fibank_vnoski_default || 12);

            if (status === 0 || normalized < min || normalized > max) {
              alert('Сумата не е в допустимия диапазон за кредит.');
              return;
            }

            // Calculate currency signs based on eur mode
            var sign = 'лв.';
            var signSecond = '€';
            switch (parseInt(eur)) {
              case 0:
                sign = 'лв.';
                signSecond = '€';
                break;
              case 1:
                sign = 'лв.';
                signSecond = '€';
                break;
              case 2:
                sign = '€';
                signSecond = 'лв.';
                break;
              case 3:
                sign = '€';
                signSecond = 'лв.';
                break;
            }
            selfRef.fibankSign(sign);
            selfRef.fibankSignSecond(signSecond);
            // vnoskaSecond will be calculated after updateInstallments
            selfRef.fibankVnoskaSecond(0);

            // Price - set observable for KO binding
            var priceDisplay = normalized.toFixed(2);
            if (eur === 1) {
              priceDisplay =
                normalized.toFixed(2) + '/' + (normalized / 1.95583).toFixed(2);
            }
            if (eur === 2) {
              priceDisplay =
                normalized.toFixed(2) + '/' + (normalized * 1.95583).toFixed(2);
            }
            selfRef.fibankPrice(priceDisplay);

            // Installment options - filtering based on visibility (bitmask logic like in cart_buttons.phtml)
            var options = [];
            for (var i = 3; i <= 60; i++) {
              // Use BigInt bit shift instead of Math.pow to preserve precision
              // BigInt(1) << BigInt(i - 3) is equivalent to pow(2, i - 3) but with full precision
              var bitShift = BigInt(i - 3);
              var bitBigInt = BigInt(1) << bitShift;
              // Check if the bit is set using BigInt operation
              var isVisibleInMask = (visibleMaskBigInt & bitBigInt) !== 0n;

              // Show installment if visible in bitmask OR if it's the default (exactly like in cart_buttons.phtml)
              // Do NOT show fallback logic - if not visible in mask and not default, don't show
              var shouldShow = isVisibleInMask || i === vnoskiDefault;

              if (shouldShow) {
                options.push({
                  value: i,
                  label: i + ' месеца',
                });
              }
            }

            selfRef.fibankVnoskiOptions(options);
            selfRef.fibankSelectedVnoski(vnoskiDefault);

            // Apply mobile classes if needed and show popup
            selfRef.applyMobileClasses(selfRef.isMobileUserAgent());
            var container = document.getElementById(
              'fibank-product-popup-container'
            );
            if (container) container.style.display = 'block';

            selfRef.updateInstallments();
          } catch (e) {
            alert('Възникна грешка при зареждане на погасителните планове.');
          }
        })
        .fail(function () {
          alert('Възникна грешка при връзка със сървъра на Fibank.');
        });
    },

    /**
     * Updates installment calculation values based on selected number of installments.
     * Fetches custom product data from server and updates monthly installment,
     * total payment, APR (GPR), and effective interest rate (GLP) observables.
     */
    updateInstallments: function () {
      var eur = parseInt(this.getConfigValue('fibank_eur') || 0);
      var currencyCode = this.getConfigValue('currency_code') || 'BGN';
      var fibankCid = this.getConfigValue('fibank_cid') || '';
      var fibankLive = this.getConfigValue('fibank_live_url') || '';
      var fibankCats = this.getConfigValue('fibank_product_cats') || '0';

      var vnoski = parseInt(this.fibankSelectedVnoski() || 12);

      var price = this.getGrandTotal();
      var normalized = this.calculatePrice(eur, currencyCode, price);

      var url =
        fibankLive +
        '/function/getproductcustom.php?cid=' +
        encodeURIComponent(fibankCid) +
        '&price=' +
        encodeURIComponent(normalized) +
        '&category_ids=' +
        encodeURIComponent(fibankCats) +
        '&fibank_vnoski=' +
        encodeURIComponent(vnoski);

      var selfRef = this;
      $.ajax({ url: url, type: 'GET', dataType: 'json' }).done(function (
        response
      ) {
        try {
          var fibank_vnoska = parseFloat(response.fibank_vnoska);
          var options = response.fibank_options;
          var visible = response.fibank_is_visible;
          var gpr = parseFloat(response.fibank_gpr || 0);
          var glp = parseFloat(response.fibank_glp || 0);
          if (visible && options) {
            // Calculate secondary installment based on eur mode
            var fibank_vnoska_second = 0;
            switch (parseInt(eur)) {
              case 0:
                fibank_vnoska_second = 0;
                break;
              case 1:
                fibank_vnoska_second = parseFloat(
                  (fibank_vnoska / 1.95583).toFixed(2)
                );
                break;
              case 2:
                fibank_vnoska_second = parseFloat(
                  (fibank_vnoska * 1.95583).toFixed(2)
                );
                break;
              case 3:
                fibank_vnoska_second = 0;
                break;
            }
            selfRef.fibankVnoskaSecond(fibank_vnoska_second);

            // Calculate total payment amount
            var obshto_total = fibank_vnoska * vnoski;

            // Format monthly installment based on eur mode
            var vnoskaDisplay = fibank_vnoska.toFixed(2);
            var obshtoDisplay = obshto_total.toFixed(2);
            if (eur === 1) {
              vnoskaDisplay =
                fibank_vnoska.toFixed(2) +
                '/' +
                (fibank_vnoska / 1.95583).toFixed(2);
              obshtoDisplay =
                obshto_total.toFixed(2) +
                '/' +
                (obshto_total / 1.95583).toFixed(2);
            }
            if (eur === 2) {
              vnoskaDisplay =
                fibank_vnoska.toFixed(2) +
                '/' +
                (fibank_vnoska * 1.95583).toFixed(2);
              obshtoDisplay =
                obshto_total.toFixed(2) +
                '/' +
                (obshto_total * 1.95583).toFixed(2);
            }

            // Update observables instead of directly modifying DOM
            selfRef.fibankVnoska(vnoskaDisplay);
            selfRef.fibankObshtozaplashtane(obshtoDisplay);
            selfRef.fibankGlp(glp.toFixed(2));
            selfRef.fibankGpr(gpr.toFixed(2));
          }
        } catch (e) {
          // swallow
        }
      });
    },

    /**
     * Checks if Fibank payment method is available.
     * @returns {boolean} True if status is 'Yes', false otherwise
     */
    getFibankStatus: function () {
      if (self.fibankStatus() == 'Yes') {
        return true;
      } else {
        return false;
      }
    },

    /**
     * Fetches Fibank checkout configuration from server.
     * Updates status, picture URLs (desktop and mobile), and loading state.
     */
    getCheckoutFibank: function () {
      self.fibankloading(true);
      $.ajax({
        url: '/mtfibankpayment/index/fibankgetcheckout',
        type: 'post',
        dataType: 'json',
        data: {},
        success: function (json) {
          self.fibankStatus(json['fibank_status']);
          self.fibankPicture(json['fibank_picture']);
          self.fibankmPicture(json['fibankm_picture']);
          self.fibankloading(false);
        },
      });
    },

    /**
     * Retrieves order ID from Fibank server and redirects to payment gateway.
     * Handles errors and email fallback if communication fails.
     */
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

    /**
     * Called after order placement is successful.
     * Initiates the process to get order ID and redirect to Fibank payment gateway.
     */
    afterPlaceOrder: function () {
      this.getOrderId();
    },
  });
});
