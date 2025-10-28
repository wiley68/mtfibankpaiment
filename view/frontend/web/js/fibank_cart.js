let old_vnoski_fibank;

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

function fibank_pogasitelni_vnoski_input_focus(_old_vnoski) {
  old_vnoski_fibank = _old_vnoski;
}

/**
 * Изчислява цената на количката с оглед опции
 * @param {number} fibank_eur - EUR code за валута
 * @param {string} fibank_currency_code - Валута код
 * @param {number} fibank_price - Базова цена
 * @returns {number} Изчислена цена
 */
function calculateCartPrice(fibank_eur, fibank_currency_code, fibank_price) {
  // Парсиране към число
  const fibank_price_parsed = parseFloat(fibank_price);

  // Прилагане на валутни конверсии
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
  console.log(fibank_eur);
  console.log(fibank_currency_code);
  console.log(fibank_price);
  console.log(fibank_priceall);

  return fibank_priceall;
}

/**
 * Обновява стойностите в цената в попъпа и бутона
 * @param {number} fibank_priceall - Обща цена
 * @param {number} fibank_eur - EUR code за валута
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
 * Обновява стойностите на бутона динамично след промяна на цената
 * Изправя AJAX заявка за да изчисли новите вноски и ги отразява в бутона
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

  // Изчисляване на новата цена
  const fibank_price_elem = document.getElementById('fibank_price').value;
  const fibank_priceall = calculateCartPrice(
    fibank_eur,
    fibank_currency_code,
    fibank_price_elem
  );

  // Проверка дали цената не е над максималната
  if (fibank_priceall > parseFloat(fibank_maxstojnost)) {
    return; // Не обновяваме ако е над максималната
  }

  // Вземане на дефолтните вноски
  const fibank_button_txt = document.querySelector('.fibank_button_txt2');
  if (fibank_button_txt) {
    // Извличане на дефолтния брой вноски от текста
    const defaultVnoskiMatch = fibank_button_txt.querySelector(
      '#mtfibank_vnoski_txt'
    );
    let defaultVnoski = 12; // fallback стойност
    if (defaultVnoskiMatch && defaultVnoskiMatch.textContent) {
      defaultVnoski = parseInt(defaultVnoskiMatch.textContent);
    } else {
      // Опитване да се вземе от скритият input
      const fibank_vnoski_input = document.getElementById(
        'fibank_pogasitelni_vnoski_input'
      );
      if (fibank_vnoski_input) {
        defaultVnoski = parseInt(fibank_vnoski_input.value) || 12;
      }
    }

    // AJAX заявка за изчисляване на новите вноски
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
            // Обновяване на стойностите в бутона
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
      // Store the selected payment method in sessionStorage
      sessionStorage.setItem(
        'autoSelectPaymentMethod',
        'mtfibankpaymentmethod'
      );

      // Redirect to checkout with payment method pre-selected
      window.location.href = '/checkout/?payment_method=mtfibankpaymentmethod';
    });

    // Function to update the cart calculations
    function updateCartCalculations() {
      const fibank_eur = parseInt(document.getElementById('fibank_eur').value);
      const fibank_currency_code = document.getElementById(
        'fibank_currency_code'
      ).value;

      // Изчисляване на новата цена
      const fibank_priceall = calculatePriceWithOptions(
        fibank_eur,
        fibank_currency_code,
        fibank_price.value
      );

      // Обновяване на изгледа
      updatePriceDisplay(fibank_priceall, fibank_eur);

      // If the popup is open, update the calculations
      if (
        fibankProductPopupContainer &&
        fibankProductPopupContainer.style.display === 'block'
      ) {
        fibank_pogasitelni_vnoski_input_change();
      } else {
        // If the popup is closed, update the values in the button
        updateButtonValues();
      }
    }
  }
});
