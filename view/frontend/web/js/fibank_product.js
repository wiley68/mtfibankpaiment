/**
 * Global variable to store the previous installment count value
 * Used to restore the value if user selects an invalid installment count
 * @type {number}
 */
let old_vnoski_fibank;

/**
 * Creates a CORS-enabled XMLHttpRequest for cross-origin requests
 * @param {string} method - HTTP method (GET, POST, etc.)
 * @param {string} url - Target URL for the request
 * @returns {XMLHttpRequest|XDomainRequest|null} The XHR object or null if not supported
 */
function createCORSRequest(method, url) {
  var xhr = new XMLHttpRequest();
  if ('withCredentials' in xhr) {
    xhr.open(method, url, true);
  } else if (typeof XDomainRequest != 'undefined') {
    xhr = new XDomainRequest();
    xhr.open(method, url);
  } else {
    xhr = null;
  }
  return xhr;
}

/**
 * Stores the old number of installments before user changes it
 * Used to restore the value if the new selection is invalid
 * @param {string} _old_vnoski - The previous installment count value
 */
function fibank_pogasitelni_vnoski_input_focus(_old_vnoski) {
  old_vnoski_fibank = _old_vnoski;
}

/**
 * Calculates the product price with options and quantity
 * Takes into account custom product options, quantity, and currency conversion
 * @param {number} fibank_eur - EUR code for currency conversion (0, 1, 2, or 3)
 * @param {string} fibank_currency_code - Current currency code (EUR or BGN)
 * @param {number} fibank_price1 - Base product price
 * @returns {number} Calculated total price after applying options and conversions
 */
function calculatePriceWithOptions(
  fibank_eur,
  fibank_currency_code,
  fibank_price1
) {
  let fibank_quantity = 1;
  if (
    document.getElementsByName('qty') !== null &&
    document.getElementsByName('qty')[0]
  ) {
    fibank_quantity = parseFloat(document.getElementsByName('qty')[0].value);
    if (fibank_quantity == 0) {
      fibank_quantity = 1;
    }
  }

  var pr = fibank_price1;
  var offers = document.querySelectorAll('[itemprop="offers"]');
  if (typeof offers[0] !== 'undefined') {
    var span1 = offers[0].querySelectorAll('[data-price-type="finalPrice"]');
    if (typeof span1[0] !== 'undefined') {
      var span2 = span1[0].innerText;
      if (typeof span2 !== 'undefined') {
        pr = span2;
      }
    }
  }

  var fibank_price1_parsed = pr.replace(/[^\d.,-]/g, '');
  if (fibank_price1_parsed[fibank_price1_parsed.length - 1] === '.') {
    fibank_price1_parsed = fibank_price1_parsed.slice(0, -1);
  }
  if (fibank_price1_parsed.indexOf('.') !== -1) {
    fibank_price1_parsed = fibank_price1_parsed.replace(/[^\d.-]/g, '');
  } else {
    fibank_price1_parsed = fibank_price1_parsed.replace(/,/g, '.');
  }
  fibank_price1_parsed = parseFloat(fibank_price1_parsed);

  let fibank_priceall = parseFloat(fibank_price1_parsed) * fibank_quantity;

  switch (fibank_eur) {
    case 0:
      break;
    case 1:
      if (fibank_currency_code == 'EUR') {
        fibank_priceall = fibank_priceall * 1.95583;
      }
      break;
    case 2:
    case 3:
      if (fibank_currency_code == 'BGN') {
        fibank_priceall = fibank_priceall / 1.95583;
      }
      break;
  }

  return fibank_priceall;
}

/**
 * Updates the price display in the popup based on calculated price and currency
 * Handles dual currency display for EUR conversion modes
 * @param {number} fibank_priceall - The calculated total price
 * @param {number} fibank_eur - EUR code for currency conversion (0, 1, 2, or 3)
 */
function updatePriceDisplay(fibank_priceall, fibank_eur) {
  const fibank_price_txt = document.getElementById('fibank_price_txt');
  if (fibank_price_txt) {
    fibank_price_txt.value = fibank_priceall.toFixed(2);
    if (fibank_eur == 1) {
      fibank_price_txt.value =
        fibank_priceall.toFixed(2) +
        '/' +
        (fibank_priceall / 1.95583).toFixed(2);
    }
    if (fibank_eur == 2) {
      fibank_price_txt.value =
        fibank_priceall.toFixed(2) +
        '/' +
        (fibank_priceall * 1.95583).toFixed(2);
    }
  }
}

/**
 * Updates button values dynamically after price change
 * Makes AJAX request to calculate new installments and displays them in the button
 * Called when product options or quantity change and popup is not open
 */
function updateButtonValues() {
  const fibank_cid = document.getElementById('fibank_cid').value;
  const FIBANK_LIVEURL = document.getElementById('FIBANK_LIVEURL').value;
  const fibank_product_cats = document.getElementById(
    'fibank_product_cats'
  ).value;
  const fibank_eur = parseInt(document.getElementById('fibank_eur').value);
  const fibank_currency_code = document.getElementById(
    'fibank_currency_code'
  ).value;
  const fibank_maxstojnost =
    document.getElementById('fibank_maxstojnost').value;

  const fibank_price_elem = document.getElementById('fibank_price');
  const fibank_priceall = calculatePriceWithOptions(
    fibank_eur,
    fibank_currency_code,
    fibank_price_elem.value
  );

  if (fibank_priceall > parseFloat(fibank_maxstojnost)) {
    return;
  }

  const fibank_button_txt = document.querySelector('.fibank_button_txt2');
  if (fibank_button_txt) {
    const defaultVnoskiMatch = fibank_button_txt.querySelector(
      '#mtfibank_vnoski_txt'
    );
    let defaultVnoski = 12;
    if (defaultVnoskiMatch && defaultVnoskiMatch.textContent) {
      defaultVnoski = parseInt(defaultVnoskiMatch.textContent);
    } else {
      const fibank_vnoski_input = document.getElementById(
        'fibank_pogasitelni_vnoski_input'
      );
      if (fibank_vnoski_input) {
        defaultVnoski = parseInt(fibank_vnoski_input.value) || 12;
      }
    }

    const xmlhttpro = createCORSRequest(
      'GET',
      FIBANK_LIVEURL +
        '/function/getproductcustom.php?cid=' +
        fibank_cid +
        '&price=' +
        fibank_priceall +
        '&category_ids=' +
        fibank_product_cats +
        '&fibank_vnoski=' +
        defaultVnoski
    );

    xmlhttpro.onreadystatechange = function () {
      if (this.readyState == 4 && this.status == 200) {
        try {
          const response = JSON.parse(this.response);
          const fibank_vnoska = parseFloat(response.fibank_vnoska);
          const options = response.fibank_options;
          const fibank_is_visible = response.fibank_is_visible;

          if (fibank_is_visible && options) {
            const mtfibank_vnoski_txt = document.getElementById(
              'mtfibank_vnoski_txt'
            );
            const mtfibank_vnoska_txt = document.getElementById(
              'mtfibank_vnoska_txt'
            );
            const mtfibank_vnoska_second_txt = document.getElementById(
              'mtfibank_vnoska_second_txt'
            );

            if (mtfibank_vnoski_txt) {
              mtfibank_vnoski_txt.textContent = defaultVnoski;
            }

            if (mtfibank_vnoska_txt) {
              mtfibank_vnoska_txt.textContent = fibank_vnoska.toFixed(2);
            }

            if (mtfibank_vnoska_second_txt && fibank_eur > 0) {
              if (fibank_eur == 1) {
                mtfibank_vnoska_second_txt.textContent = (
                  fibank_vnoska / 1.95583
                ).toFixed(2);
              } else if (fibank_eur == 2) {
                mtfibank_vnoska_second_txt.textContent = (
                  fibank_vnoska * 1.95583
                ).toFixed(2);
              }
            }
          }
        } catch (e) {
          console.error('Error parsing Fibank response:', e);
        }
      }
    };

    xmlhttpro.send();
  }
}

/**
 * Handles installment count change in the popup
 * Sends AJAX request to recalculate installment amounts based on new count
 * Updates both popup fields and button values dynamically
 */
function fibank_pogasitelni_vnoski_input_change() {
  const fibank_eur = parseInt(document.getElementById('fibank_eur').value);
  const fibank_vnoski = parseFloat(
    document.getElementById('fibank_pogasitelni_vnoski_input').value
  );
  const fibank_price = parseFloat(
    document.getElementById('fibank_price_txt').value
  );
  const fibank_cid = document.getElementById('fibank_cid').value;
  const FIBANK_LIVEURL = document.getElementById('FIBANK_LIVEURL').value;
  const fibank_product_cats = document.getElementById(
    'fibank_product_cats'
  ).value;
  var xmlhttpro = createCORSRequest(
    'GET',
    FIBANK_LIVEURL +
      '/function/getproductcustom.php?cid=' +
      fibank_cid +
      '&price=' +
      fibank_price +
      '&category_ids=' +
      fibank_product_cats +
      '&fibank_vnoski=' +
      fibank_vnoski
  );
  xmlhttpro.onreadystatechange = function () {
    if (this.readyState == 4) {
      var options = JSON.parse(this.response).fibank_options;
      var fibank_vnoska = parseFloat(JSON.parse(this.response).fibank_vnoska);
      var fibank_gpr_res = parseFloat(JSON.parse(this.response).fibank_gpr);
      var fibank_glp_res = parseFloat(JSON.parse(this.response).fibank_glp);
      var fibank_is_visible = JSON.parse(this.response).fibank_is_visible;
      if (fibank_is_visible) {
        if (options) {
          const mtfibank_vnoski_txt = document.getElementById(
            'mtfibank_vnoski_txt'
          );
          if (mtfibank_vnoski_txt) {
            mtfibank_vnoski_txt.textContent = fibank_vnoski;
          }
          const fibank_vnoska_input = document.getElementById('fibank_vnoska');
          const fibank_gpr = document.getElementById('fibank_gpr');
          const fibank_glp = document.getElementById('fibank_glp');
          const fibank_obshtozaplashtane_input = document.getElementById(
            'fibank_obshtozaplashtane'
          );
          const mtfibank_vnoska_txt = document.getElementById(
            'mtfibank_vnoska_txt'
          );
          if (mtfibank_vnoska_txt) {
            mtfibank_vnoska_txt.textContent = fibank_vnoska.toFixed(2);
          }
          fibank_vnoska_input.value = fibank_vnoska.toFixed(2);
          fibank_obshtozaplashtane_input.value = (
            fibank_vnoska * fibank_vnoski
          ).toFixed(2);
          const mtfibank_vnoska_second_txt = document.getElementById(
            'mtfibank_vnoska_second_txt'
          );
          if (fibank_eur == 1) {
            fibank_vnoska_input.value =
              fibank_vnoska.toFixed(2) +
              '/' +
              (fibank_vnoska / 1.95583).toFixed(2);
            fibank_obshtozaplashtane_input.value =
              (fibank_vnoska * fibank_vnoski).toFixed(2) +
              '/' +
              ((fibank_vnoska * fibank_vnoski) / 1.95583).toFixed(2);
            if (mtfibank_vnoska_second_txt) {
              mtfibank_vnoska_second_txt.textContent = (
                fibank_vnoska / 1.95583
              ).toFixed(2);
            }
          }
          if (fibank_eur == 2) {
            fibank_vnoska_input.value =
              fibank_vnoska.toFixed(2) +
              '/' +
              (fibank_vnoska * 1.95583).toFixed(2);
            fibank_obshtozaplashtane_input.value =
              (fibank_vnoska * fibank_vnoski).toFixed(2) +
              '/' +
              (fibank_vnoska * fibank_vnoski * 1.95583).toFixed(2);
            if (mtfibank_vnoska_second_txt) {
              mtfibank_vnoska_second_txt.textContent = (
                fibank_vnoska * 1.95583
              ).toFixed(2);
            }
          }
          fibank_gpr.value = fibank_gpr_res.toFixed(2);
          fibank_glp.value = fibank_glp_res.toFixed(2);
          old_vnoski_fibank = fibank_vnoski;
        } else {
          alert('Избраният брой погасителни вноски е под минималния.');
          var fibank_vnoski_input = document.getElementById(
            'fibank_pogasitelni_vnoski_input'
          );
          fibank_vnoski_input.value = old_vnoski_fibank;
        }
      } else {
        alert('Избраният брой погасителни вноски е над максималния.');
        var fibank_vnoski_input = document.getElementById(
          'fibank_pogasitelni_vnoski_input'
        );
        fibank_vnoski_input.value = old_vnoski_fibank;
      }
    }
  };
  xmlhttpro.send();
}

document.addEventListener('DOMContentLoaded', function () {
  const btn_fibank = document.getElementById('btn_fibank');
  if (btn_fibank !== null) {
    const fibank_button_status = parseInt(
      document.getElementById('fibank_button_status').value
    );
    const fibankProductPopupContainer = document.getElementById(
      'fibank-product-popup-container'
    );
    const fibank_back_credit = document.getElementById('fibank_back_credit');
    const fibank_buy_credit = document.getElementById('fibank_buy_credit');
    const fibank_buy_buttons_submit = document.querySelectorAll(
      'button#product-addtocart-button'
    );

    const fibank_price = document.getElementById('fibank_price');
    const fibank_maxstojnost = document.getElementById('fibank_maxstojnost');
    let fibank_price1 = fibank_price.value;
    let fibank_quantity = 1;
    let fibank_priceall = parseFloat(fibank_price1) * fibank_quantity;

    btn_fibank.addEventListener('click', (event) => {
      const fibank_eur = parseInt(document.getElementById('fibank_eur').value);
      const fibank_currency_code = document.getElementById(
        'fibank_currency_code'
      ).value;
      if (fibank_button_status == 1) {
        if (fibank_buy_buttons_submit.length) {
          sessionStorage.setItem(
            'autoSelectPaymentMethod',
            'mtfibankpaymentmethod'
          );

          fibank_buy_buttons_submit.item(0).click();

          setTimeout(() => {
            window.location.href =
              '/checkout/?payment_method=mtfibankpaymentmethod';
          }, 1500);
        }
      } else {
        fibank_priceall = calculatePriceWithOptions(
          fibank_eur,
          fibank_currency_code,
          fibank_price1
        );

        updatePriceDisplay(fibank_priceall, fibank_eur);

        if (fibank_priceall <= parseFloat(fibank_maxstojnost.value)) {
          fibankProductPopupContainer.style.display = 'block';
          fibank_pogasitelni_vnoski_input_change();
        } else {
          alert(
            'Максимално позволената цена за кредит ' +
              parseFloat(fibank_maxstojnost.value).toFixed(2) +
              ' е надвишена!'
          );
        }
      }
    });

    fibank_back_credit.addEventListener('click', (event) => {
      fibankProductPopupContainer.style.display = 'none';
    });

    fibank_buy_credit.addEventListener('click', (event) => {
      fibankProductPopupContainer.style.display = 'none';
      if (fibank_buy_buttons_submit.length) {
        sessionStorage.setItem(
          'autoSelectPaymentMethod',
          'mtfibankpaymentmethod'
        );

        fibank_buy_buttons_submit.item(0).click();

        setTimeout(() => {
          window.location.href =
            '/checkout/?payment_method=mtfibankpaymentmethod';
        }, 1500);
      }
    });

    const qtyInputs = document.querySelectorAll('input[name="qty"]');
    if (qtyInputs.length > 0) {
      qtyInputs.forEach((qtyInput) => {
        qtyInput.addEventListener('change', function () {
          updateFibankCalculations();
        });
      });
    }

    const fibankSpanOffers = document.querySelectorAll('[itemprop="offers"]');
    if (typeof fibankSpanOffers[0] !== 'undefined') {
      const fibankSpanFinalPrice = fibankSpanOffers[0].querySelectorAll(
        '[data-price-type="finalPrice"]'
      );
      if (typeof fibankSpanFinalPrice[0] !== 'undefined') {
        const fibankTargetNode = fibankSpanFinalPrice[0];
        if (fibankTargetNode !== null) {
          if (fibankTargetNode instanceof Node) {
            const observer = new MutationObserver(mutationCallback);
            const config = {
              childList: true,
              subtree: true,
            };
            function mutationCallback(mutationsList, observer) {
              updateFibankCalculations();
            }
            observer.observe(fibankTargetNode, config);
          }
        }
      }
    }

    /**
     * Updates Fibank calculations when product options or quantity change
     * Calculates new price with options, updates display, and refreshes installment calculations
     * If popup is open, updates popup; otherwise updates button values
     */
    function updateFibankCalculations() {
      const fibank_eur = parseInt(document.getElementById('fibank_eur').value);
      const fibank_currency_code = document.getElementById(
        'fibank_currency_code'
      ).value;

      const fibank_priceall = calculatePriceWithOptions(
        fibank_eur,
        fibank_currency_code,
        fibank_price.value
      );

      updatePriceDisplay(fibank_priceall, fibank_eur);

      if (
        fibankProductPopupContainer &&
        fibankProductPopupContainer.style.display === 'block'
      ) {
        fibank_pogasitelni_vnoski_input_change();
      } else {
        updateButtonValues();
      }
    }
  }
});
