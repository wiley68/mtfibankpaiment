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

    /** Returns send check to info */
    getMailingAddress: function () {
      return window.checkoutConfig.payment.checkmo.mailingAddress;
    },

    fibankloading: ko.observable(true),
    fibankStatus: ko.observable(''),
    fibankPicture: ko.observable(''),
    fibankmPicture: ko.observable(''),

    initialize: function () {
      self = this;
      this._super();
      this.getCheckoutFibank();

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

      // Expose handlers used by select in template
      window.fibankCheckoutFocus = function (oldVal) {
        window._fibank_old_vnoski = oldVal;
      };
      window.fibankCheckoutChange = function () {
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

    getConfigValue: function (key) {
      var cfg =
        window.checkoutConfig &&
        window.checkoutConfig.payment &&
        window.checkoutConfig.payment.mtfibankpaymentmethod;
      return cfg ? cfg[key] : undefined;
    },

    getGrandTotal: function () {
      var totals = quote.getTotals() && quote.getTotals();
      return totals && totals()['grand_total']
        ? parseFloat(totals()['grand_total'])
        : 0;
    },

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

    getFibankPicture: function () {
      if (this.isMobileUserAgent()) {
        return this.fibankmPicture();
      } else {
        return this.fibankPicture();
      }
    },

    applyMobileClasses: function (isMobile) {
      var container = document.getElementById('fibank-product-popup-container');
      if (!container) return;
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
            var visibleMask = parseInt(resp.fibank_vnoski_visible || 0);
            var vnoskiDefault = parseInt(resp.fibank_vnoski_default || 12);

            if (status === 0 || normalized < min || normalized > max) {
              alert('Сумата не е в допустимия диапазон за кредит.');
              return;
            }

            // Цена
            var priceInput = document.getElementById('fibank_price_txt');
            if (priceInput) {
              priceInput.value = normalized.toFixed(2);
              if (eur === 1) {
                priceInput.value =
                  normalized.toFixed(2) +
                  '/' +
                  (normalized / 1.95583).toFixed(2);
              }
              if (eur === 2) {
                priceInput.value =
                  normalized.toFixed(2) +
                  '/' +
                  (normalized * 1.95583).toFixed(2);
              }
            }

            // Опции за вноски
            var selectEl = document.getElementById(
              'fibank_pogasitelni_vnoski_input'
            );
            if (selectEl) {
              while (selectEl.firstChild)
                selectEl.removeChild(selectEl.firstChild);
              for (var i = 3; i <= 60; i++) {
                var bit = 1 << (i - 3);
                var allowed = (visibleMask & bit) !== 0;
                if (!allowed && i !== vnoskiDefault) continue;
                var opt = document.createElement('option');
                opt.value = String(i);
                opt.textContent = i + ' месеца';
                if (i === vnoskiDefault) opt.selected = true;
                selectEl.appendChild(opt);
              }
            }

            // Прилага мобилните класове при нужда и показва попъпа
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

    updateInstallments: function () {
      var eur = parseInt(this.getConfigValue('fibank_eur') || 0);
      var currencyCode = this.getConfigValue('currency_code') || 'BGN';
      var fibankCid = this.getConfigValue('fibank_cid') || '';
      var fibankLive = this.getConfigValue('fibank_live_url') || '';
      var fibankCats = this.getConfigValue('fibank_product_cats') || '0';

      var vnoskiEl = document.getElementById('fibank_pogasitelni_vnoski_input');
      var vnoski = vnoskiEl ? parseInt(vnoskiEl.value) : 12;

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
            var vnoskaInput = document.getElementById('fibank_vnoska');
            var obshtoInput = document.getElementById(
              'fibank_obshtozaplashtane'
            );
            var gprInput = document.getElementById('fibank_gpr');
            var glpInput = document.getElementById('fibank_glp');
            if (vnoskaInput) vnoskaInput.value = fibank_vnoska.toFixed(2);
            if (obshtoInput)
              obshtoInput.value = (fibank_vnoska * vnoski).toFixed(2);
            if (gprInput) gprInput.value = gpr.toFixed(2);
            if (glpInput) glpInput.value = glp.toFixed(2);
          }
        } catch (e) {
          // swallow
        }
      });
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
          self.fibankPicture(json['fibank_picture']);
          self.fibankmPicture(json['fibankm_picture']);
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
