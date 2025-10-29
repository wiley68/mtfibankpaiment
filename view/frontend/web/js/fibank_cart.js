/**
 * Last valid number of installments.
 * Used to restore the value on invalid selection.
 * @type {number|undefined}
 */
let old_vnoski_fibank;

/**
 * Creates an XHR request with CORS support (falls back to XDomainRequest for old IE).
 * @param {('GET'|'POST'|'PUT'|'DELETE'|'PATCH'|'HEAD'|'OPTIONS')} method - HTTP method
 * @param {string} url - Target URL
 * @returns {XMLHttpRequest|null} Initialized XHR object or null if unsupported
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
 * Stores the current valid number of installments on focus,
 * so it can be restored on invalid change.
 * @param {number} _old_vnoski - Current valid number of installments
 */
function fibank_pogasitelni_vnoski_input_focus(_old_vnoski) {
  old_vnoski_fibank = _old_vnoski;
}

/**
 * Calculates the cart price considering currency options.
 * @param {number} fibank_eur - EUR mode code for currency handling
 * @param {string} fibank_currency_code - Currency code
 * @param {number} fibank_price - Base price
 * @returns {number} Calculated price
 */
function calculateCartPrice(fibank_eur, fibank_currency_code, fibank_price) {
  // Parse to number
  const fibank_price_parsed = parseFloat(fibank_price);

  // Apply currency conversions
  let fibank_priceall = fibank_price_parsed;
  switch (fibank_eur) {
    case 0:
      fibank_priceall = fibank_price_parsed;
      break;
    case 1:
      if (fibank_currency_code == 'EUR') {
        fibank_priceall = fibank_price_parsed * 1.95583;
      }
      break;
    case 2:
    case 3:
      if (fibank_currency_code == 'BGN') {
        fibank_priceall = fibank_price_parsed / 1.95583;
      }
      break;
  }

  return fibank_priceall;
}

/**
 * Updates the price values shown in the popup and on the button.
 * @param {number} fibank_priceall - Total price
 * @param {number} fibank_eur - EUR mode code for currency handling
 */
function updateCartPriceDisplay(fibank_priceall, fibank_eur) {
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
 * Dynamically updates the button values after price changes.
 * Sends an AJAX request to compute new installments and reflects them on the button.
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

  // Calculate the new price
  const fibank_price_elem = document.getElementById('fibank_price').value;
  const fibank_priceall = calculateCartPrice(
    fibank_eur,
    fibank_currency_code,
    fibank_price_elem
  );

  // Check if the price exceeds the maximum
  if (fibank_priceall > parseFloat(fibank_maxstojnost)) {
    return; // Do not update if it exceeds the maximum
  }

  // Get the default number of installments
  const fibank_button_txt = document.querySelector('.fibank_button_txt2');
  if (fibank_button_txt) {
    // Extract default number of installments from text
    const defaultVnoskiMatch = fibank_button_txt.querySelector(
      '#mtfibank_vnoski_txt'
    );
    let defaultVnoski = 12; // fallback стойност
    if (defaultVnoskiMatch && defaultVnoskiMatch.textContent) {
      defaultVnoski = parseInt(defaultVnoskiMatch.textContent);
    } else {
      // Try to get it from the hidden input
      const fibank_vnoski_input = document.getElementById(
        'fibank_pogasitelni_vnoski_input'
      );
      if (fibank_vnoski_input) {
        defaultVnoski = parseInt(fibank_vnoski_input.value) || 12;
      }
    }

    // AJAX request to calculate new installments
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
          /**
           * @typedef {Object} FibankResponse
           * @property {number|string} fibank_vnoska - Monthly installment amount
           * @property {any} fibank_options - Available options/validations from the server
           * @property {boolean} fibank_is_visible - Visibility/validity flag
           * @property {number|string} [fibank_gpr]
           * @property {number|string} [fibank_glp]
           */
          /** @type {FibankResponse} */
          const response = JSON.parse(this.response);
          const fibank_vnoska = parseFloat(response.fibank_vnoska);
          const options = response.fibank_options;
          const fibank_is_visible = response.fibank_is_visible;

          if (fibank_is_visible && options) {
            // Update values in the button
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
 * Handles a change in the number of installments: sends a request to the service,
 * calculates and updates related values (installment, APR, interest, total payment)
 * and the UI elements.
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
      /** @type {FibankResponse} */
      var parsed = JSON.parse(this.response);
      var options = parsed.fibank_options;
      var fibank_vnoska = parseFloat(parsed.fibank_vnoska);
      var fibank_gpr_res = parseFloat(parsed.fibank_gpr);
      var fibank_glp_res = parseFloat(parsed.fibank_glp);
      var fibank_is_visible = parsed.fibank_is_visible;
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
          alert('The selected number of installments is below the minimum.');
          var fibank_vnoski_input = document.getElementById(
            'fibank_pogasitelni_vnoski_input'
          );
          fibank_vnoski_input.value = old_vnoski_fibank;
        }
      } else {
        alert('The selected number of installments is above the maximum.');
        var fibank_vnoski_input = document.getElementById(
          'fibank_pogasitelni_vnoski_input'
        );
        fibank_vnoski_input.value = old_vnoski_fibank;
      }
    }
  };
  xmlhttpro.send();
}

/**
 * Initializes event handlers for buttons and the popup on the cart page,
 * and sets up automatic calculation/updating of values.
 */
document.addEventListener('DOMContentLoaded', function () {
  const btn_fibank_cart = document.getElementById('btn_fibank_cart');
  if (btn_fibank_cart !== null) {
    const fibank_button_cart_status = parseInt(
      document.getElementById('fibank_button_cart_status').value
    );
    const fibankProductPopupContainer = document.getElementById(
      'fibank-product-popup-container'
    );
    const fibank_back_credit = document.getElementById('fibank_back_credit');
    const fibank_buy_credit = document.getElementById('fibank_buy_credit');

    const fibank_price = document.getElementById('fibank_price').value;
    const fibank_maxstojnost = document.getElementById('fibank_maxstojnost');

    btn_fibank_cart.addEventListener('click', (event) => {
      const fibank_eur = parseInt(document.getElementById('fibank_eur').value);
      const fibank_currency_code = document.getElementById(
        'fibank_currency_code'
      ).value;
      if (fibank_button_cart_status == 1) {
        // Store the selected payment method in sessionStorage
        sessionStorage.setItem(
          'autoSelectPaymentMethod',
          'mtfibankpaymentmethod'
        );

        window.location.href =
          '/checkout/?payment_method=mtfibankpaymentmethod';
      } else {
        // Calculate the price with options
        const fibank_priceall = calculateCartPrice(
          fibank_eur,
          fibank_currency_code,
          fibank_price
        );

        // Update the price display
        updateCartPriceDisplay(fibank_priceall, fibank_eur);

        if (fibank_priceall <= parseFloat(fibank_maxstojnost.value)) {
          fibankProductPopupContainer.style.display = 'block';
          fibank_pogasitelni_vnoski_input_change();
        } else {
          alert(
            'The maximum allowed credit price ' +
              parseFloat(fibank_maxstojnost.value).toFixed(2) +
              ' has been exceeded!'
          );
        }
      }
    });

    fibank_back_credit.addEventListener('click', (event) => {
      fibankProductPopupContainer.style.display = 'none';
    });

    fibank_buy_credit.addEventListener('click', (event) => {
      fibankProductPopupContainer.style.display = 'none';
      // Store the selected payment method in sessionStorage
      sessionStorage.setItem(
        'autoSelectPaymentMethod',
        'mtfibankpaymentmethod'
      );

      // Redirect to checkout with payment method pre-selected
      window.location.href = '/checkout/?payment_method=mtfibankpaymentmethod';
    });
  }
});
