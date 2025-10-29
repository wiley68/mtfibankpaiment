<?php

/**
 * CartButtons File Doc Comment
 *
 * PHP version 8
 *
 * @category CartButtons
 * @package  CartButtons
 * @author   Ilko Ivanov <ilko.iv@gmail.com>
 * @license  http://www.gnu.org/copyleft/gpl.html GNU General Public License
 * @link     https://avalonbg.com/
 */

namespace Avalon\Mtfibankpayment\Block;

use \Avalon\Mtfibankpayment\Helper\Data;

/**
 * CartButtons Class Doc Comment
 *
 * CartButtons Class
 *
 * @author   Ilko Ivanov <ilko.iv@gmail.com>
 * @license  http://www.gnu.org/copyleft/gpl.html GNU General Public License
 * @link     https://avalonbg.com/
 */
class CartButtons extends \Magento\Framework\View\Element\Template
{
    /**
     * @var \Magento\Framework\HTTP\Client\Curl
     */
    protected $_curl;

    /**
     * @var object
     */
    protected $_paramsfibank;

    /**
     * @var \Magento\Framework\App\Request\Http
     */
    protected $_request_http;

    /**
     * @var \Magento\Store\Model\StoreManagerInterface
     */
    protected $_storeManager;

    /**
     * @var int
     */
    protected $_fibank_eur;

    /**
     * @var \Magento\Checkout\Model\Session
     */
    protected $_checkoutSession;

    /**
     * CartButtons constructor Doc Comment
     *
     * CartButtons Class constructor
     *
     * @param \Magento\Framework\View\Element\Template\Context $context
     * @param \Magento\Framework\HTTP\Client\Curl $curl
     * @param \Magento\Framework\App\Request\Http $request_http
     * @param \Magento\Store\Model\StoreManagerInterface $storeManager
     * @param \Magento\Checkout\Model\Session $checkoutSession
     * @param array $data
     */
    public function __construct(
        \Magento\Framework\View\Element\Template\Context $context,
        \Magento\Framework\HTTP\Client\Curl $curl,
        \Magento\Framework\App\Request\Http $request_http,
        \Magento\Store\Model\StoreManagerInterface $storeManager,
        \Magento\Checkout\Model\Session $checkoutSession,
        array $data = []
    ) {
        parent::__construct($context, $data);
        $this->_curl = $curl;
        $this->_request_http = $request_http;
        $this->_storeManager = $storeManager;
        $this->_checkoutSession = $checkoutSession;
        $this->_fibank_eur = $this->retrieveEur();
        $this->_paramsfibank = $this->retrieveParamsFibank();
    }

    /**
     * CartButtons getQuote Doc Comment
     *
     * CartButtons getQuote function,
     * return quote info
     *
     * @return \Magento\Quote\Model\Quote
     */
    public function getQuote()
    {
        /** @var \Magento\Quote\Model\Quote $quote */
        $quote = $this->_checkoutSession->getQuote();
        return $quote;
    }

    /**
     * CartButtons retrieveParamsFibank Doc Comment
     *
     * CartButtons retrieveParamsFibank function,
     * return params info
     *
     * @return mixed
     */
    public function retrieveParamsFibank()
    {
        $objectManager = \Magento\Framework\App\ObjectManager::getInstance();
        $helper = $objectManager->create(Data::class);

        if ($helper->getConfig('avalon_mtfibankpaymentmethod_tab_options/properties_fibank/fibank_cid')) {
            $fibank_cid = $helper->getConfig('avalon_mtfibankpaymentmethod_tab_options/properties_fibank/fibank_cid');
        } else {
            $fibank_cid = "";
        }

        $quote = $this->getQuote();
        $cartItems = $quote->getAllItems();

        // Calculate total amount from cart items
        $cartTotal = 0;
        foreach ($cartItems as $item) {
            $cartTotal += $item->getPrice() * $item->getQty();
        }

        $fibank_price = $cartTotal;

        // Get all category IDs from cart items
        $fibank_product_cats = $this->getFibankProductCats();

        /** @var \Magento\Store\Model\Store $store */
        $store = $this->_storeManager->getStore();
        $fibank_currency_code = $store->getCurrentCurrencyCode();
        $fibank_sign_second = $this->_fibank_eur == 2 || $this->_fibank_eur == 3 ? 'лв.' : '€';
        switch ($this->_fibank_eur) {
            case 0:
                break;
            case 1:
                if ($fibank_currency_code == "EUR") {
                    $fibank_price = number_format($fibank_price * 1.95583, 2, ".", "");
                }
                break;
            case 2:
            case 3:
                if ($fibank_currency_code == "BGN") {
                    $fibank_price = number_format($fibank_price / 1.95583, 2, ".", "");
                }
                break;
        }

        $this->_curl->setOption(CURLOPT_SSL_VERIFYPEER, false);
        $this->_curl->setOption(CURLOPT_RETURNTRANSFER, true);
        $this->_curl->setOption(CURLOPT_MAXREDIRS, 3);
        $this->_curl->setOption(CURLOPT_TIMEOUT, 6);
        $this->_curl->setOption(CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1);
        $this->_curl->setOption(CURLOPT_CUSTOMREQUEST, 'GET');
        $this->_curl->get(
            $helper->getFibankLiveUrl() .
            '/function/getproduct.php?cid=' .
            $fibank_cid .
            '&price=' .
            $fibank_price .
            '&category_ids=' .
            $fibank_product_cats
        );
        $response = $this->_curl->getBody();

        if ($response != null) {
            $paramsfibank = json_decode($response);

            $fibank_vnoska_second = 0;
            $fibank_price_second = 0;
            $fibank_sign = 'лв.';
            $fibank_sign_second = '€';
            $fibank_vnoska = floatval($paramsfibank->fibank_vnoska);
            switch ($this->_fibank_eur) {
                case 0:
                    $fibank_vnoska_second = 0;
                    $fibank_price_second = 0;
                    $fibank_sign = 'лв.';
                    $fibank_sign_second = '€';
                    break;
                case 1:
                    $fibank_price_second = number_format($fibank_price / 1.95583, 2, ".", "");
                    $fibank_vnoska_second = number_format($fibank_vnoska / 1.95583, 2, ".", "");
                    $fibank_sign = 'лв.';
                    $fibank_sign_second = '€';
                    break;
                case 2:
                    $fibank_price_second = number_format($fibank_price * 1.95583, 2, ".", "");
                    $fibank_vnoska_second = number_format($fibank_vnoska * 1.95583, 2, ".", "");
                    $fibank_sign = '€';
                    $fibank_sign_second = 'лв.';
                    break;
                case 3:
                    $fibank_price_second = 0;
                    $fibank_vnoska_second = 0;
                    $fibank_sign = '€';
                    $fibank_sign_second = 'лв.';
                    break;
            }

            $paramsfibank->fibank_price_second = $fibank_price_second;
            $paramsfibank->fibank_vnoska_second = $fibank_vnoska_second;
            $paramsfibank->fibank_sign = $fibank_sign;
            $paramsfibank->fibank_sign_second = $fibank_sign_second;
            return $paramsfibank;
        } else {
            return null;
        }
    }

    /**
     * CartButtons retrieveEur Doc Comment
     *
     * CartButtons retrieveEur function,
     *
     * @return string
     */
    public function retrieveEur()
    {
        $objectManager = \Magento\Framework\App\ObjectManager::getInstance();
        $helper = $objectManager->create(Data::class);

        if ($helper->getConfig('avalon_mtfibankpaymentmethod_tab_options/properties_fibank/fibank_cid')) {
            $fibank_cid = $helper->getConfig('avalon_mtfibankpaymentmethod_tab_options/properties_fibank/fibank_cid');
        } else {
            $fibank_cid = "";
        }

        $this->_curl->setOption(CURLOPT_SSL_VERIFYPEER, false);
        $this->_curl->setOption(CURLOPT_RETURNTRANSFER, true);
        $this->_curl->setOption(CURLOPT_MAXREDIRS, 3);
        $this->_curl->setOption(CURLOPT_TIMEOUT, 5);
        $this->_curl->setOption(CURLOPT_CUSTOMREQUEST, 'GET');
        $this->_curl->get(
            $helper->getFibankLiveUrl() .
            '/function/geteur.php?cid=' .
            $fibank_cid
        );
        $response = $this->_curl->getBody();

        if ($response != null) {
            $eurfibank = json_decode($response);
            return (int) $eurfibank->fibank_eur;
        } else {
            return 0;
        }
    }

    /**
     * CartButtons getFibankLiveUrl Doc Comment
     *
     * CartButtons getFibankLiveUrl function,
     *
     * @return string
     */
    public function getFibankLiveUrl()
    {
        $objectManager = \Magento\Framework\App\ObjectManager::getInstance();
        $helper = $objectManager->create(Data::class);
        return $helper->getFibankLiveUrl();
    }

    /**
     * CartButtons getFibankProductCats Doc Comment
     *
     * CartButtons getFibankProductCats function,
     *
     * @return string
     */
    public function getFibankProductCats()
    {
        $quote = $this->getQuote();
        $cartItems = $quote->getAllItems();

        $commonCats = null;

        foreach ($cartItems as $item) {
            $product = $item->getProduct();
            $cats = $product->getCategoryIds();

            if ($commonCats === null) {
                // The first product — initialize with its categories
                $commonCats = $cats;
            } else {
                // Take only the common categories with the current product
                $commonCats = array_intersect($commonCats, $cats);
            }

            // If there are no common categories — there is no sense to continue
            if (empty($commonCats)) {
                return '0';
            }
        }

        // If there is a result after the loop — return it as a string with "_"
        return !empty($commonCats) ? implode('_', $commonCats) : '0';
    }

    /**
     * CartButtons getParamsFibank Doc Comment
     *
     * CartButtons getParamsFibank function,
     * return params
     *
     * @return object|null
     */
    public function getParamsFibank()
    {
        return $this->_paramsfibank;
    }

    /**
     * CartButtons getEur Doc Comment
     *
     * CartButtons getEur function,
     * return params
     *
     * @return int
     */
    public function getEur()
    {
        return $this->_fibank_eur;
    }

    /**
     * CartButtons getCurrencyCode Doc Comment
     *
     * CartButtons getCurrencyCode function,
     * return params
     *
     * @return string
     */
    public function getCurrencyCode()
    {
        /** @var \Magento\Store\Model\Store $store */
        $store = $this->_storeManager->getStore();
        return $store->getCurrentCurrencyCode();
    }

    /**
     * CartButtons getPrice Doc Comment
     *
     * CartButtons getPrice function,
     *
     * @return mixed
     */
    public function getPrice()
    {
        $quote = $this->getQuote();
        $cartItems = $quote->getAllItems();

        // Calculate total amount from cart items
        $cartTotal = 0;
        foreach ($cartItems as $item) {
            $cartTotal += $item->getPrice() * $item->getQty();
        }

        $fibank_price = $cartTotal;
        /** @var \Magento\Store\Model\Store $store */
        $store = $this->_storeManager->getStore();
        $fibank_currency_code = $store->getCurrentCurrencyCode();
        switch ($this->_fibank_eur) {
            case 0:
                break;
            case 1:
                if ($fibank_currency_code == "EUR") {
                    $fibank_price = number_format($fibank_price * 1.95583, 2, ".", "");
                }
                break;
            case 2:
            case 3:
                if ($fibank_currency_code == "BGN") {
                    $fibank_price = number_format($fibank_price / 1.95583, 2, ".", "");
                }
                break;
        }
        return $fibank_price;
    }

    /**
     * CartButtons getStatus Doc Comment
     *
     * CartButtons getStatus function,
     *
     * @return bool
     */
    public function getStatus()
    {
        if ($this->_paramsfibank != null) {
            $quote = $this->getQuote();
            $cartItems = $quote->getAllItems();

            // Calculate total amount from cart items
            $cartTotal = 0;
            foreach ($cartItems as $item) {
                $cartTotal += $item->getPrice() * $item->getQty();
            }

            $fibank_price = $cartTotal;
            $fibank_options = boolval($this->_paramsfibank->fibank_options);
            $fibank_is_visible = boolval($this->_paramsfibank->fibank_is_visible);
            $fibank_button_cart_status = (int) $this->_paramsfibank->fibank_button_cart_status;
            return $fibank_price > 0 &&
                $fibank_options &&
                $fibank_is_visible &&
                $this->_paramsfibank->fibank_status == 1 &&
                $fibank_button_cart_status != 0;
        } else {
            return false;
        }
    }

    /**
     * CartButtons getFibankCid Doc Comment
     *
     * CartButtons getFibankCid function,
     *
     * @return string
     */
    public function getFibankCid()
    {
        $objectManager = \Magento\Framework\App\ObjectManager::getInstance();
        $helper = $objectManager->create(Data::class);
        if ($helper->getConfig('avalon_mtfibankpaymentmethod_tab_options/properties_fibank/fibank_cid')) {
            $fibank_cid = $helper->getConfig('avalon_mtfibankpaymentmethod_tab_options/properties_fibank/fibank_cid');
        } else {
            $fibank_cid = "";
        }
        return $fibank_cid;
    }

    /**
     * CartButtons getFibankStatus Doc Comment
     *
     * CartButtons getFibankStatus function,
     *
     * @return string
     */
    public function getFibankStatus()
    {
        $objectManager = \Magento\Framework\App\ObjectManager::getInstance();
        $helper = $objectManager->create(Data::class);
        if ($helper->getConfig('avalon_mtfibankpaymentmethod_tab_options/properties_fibank/fibank_status')) {
            $fibank_status =
                $helper->getConfig(
                    'avalon_mtfibankpaymentmethod_tab_options/properties_fibank/fibank_status'
                );
        } else {
            $fibank_status = "";
        }
        /** @var \Magento\Store\Model\Store $store */
        $store = $this->_storeManager->getStore();
        $fibank_currency_code = $store->getCurrentCurrencyCode();
        return ($fibank_status && ($fibank_currency_code == "EUR" || $fibank_currency_code == "BGN"));
    }

    /**
     * CartButtons getFibankButtonNormalCustom Doc Comment
     *
     * CartButtons getFibankButtonNormalCustom function,
     *
     * @return string
     */
    public function getFibankButtonNormalCustom()
    {
        $objectManager = \Magento\Framework\App\ObjectManager::getInstance();
        $helper = $objectManager->create(Data::class);
        if ($helper->getConfig('avalon_mtfibankpaymentmethod_tab_options/properties_fibank/fibank_cid')) {
            $fibank_cid = $helper->getConfig('avalon_mtfibankpaymentmethod_tab_options/properties_fibank/fibank_cid');
        } else {
            $fibank_cid = "";
        }
        return $helper->getFibankLiveUrl() . '/calculators/assets/img/custom_buttons/' . $fibank_cid . '.png';
    }

    /**
     * CartButtons getFibankButtonHoverCustom Doc Comment
     *
     * CartButtons getFibankButtonHoverCustom function,
     *
     * @return string
     */
    public function getFibankButtonHoverCustom()
    {
        $objectManager = \Magento\Framework\App\ObjectManager::getInstance();
        $helper = $objectManager->create(Data::class);
        if ($helper->getConfig('avalon_mtfibankpaymentmethod_tab_options/properties_fibank/fibank_cid')) {
            $fibank_cid = $helper->getConfig('avalon_mtfibankpaymentmethod_tab_options/properties_fibank/fibank_cid');
        } else {
            $fibank_cid = "";
        }
        return $helper->getFibankLiveUrl() . '/calculators/assets/img/custom_buttons/' . $fibank_cid . '_hover.png';
    }

    /**
     * CartButtons getFibankButtonNormal Doc Comment
     *
     * CartButtons getFibankButtonNormal function,
     *
     * @return string
     */
    public function getFibankButtonNormal()
    {
        $objectManager = \Magento\Framework\App\ObjectManager::getInstance();
        $helper = $objectManager->create(Data::class);
        return $helper->getFibankLiveUrl() . '/calculators/assets/img/buttons/fibank.png';
    }

    /**
     * CartButtons getFibankButtonHover Doc Comment
     *
     * CartButtons getFibankButtonHover function,
     *
     * @return string
     */
    public function getFibankButtonHover()
    {
        $objectManager = \Magento\Framework\App\ObjectManager::getInstance();
        $helper = $objectManager->create(Data::class);
        return $helper->getFibankLiveUrl() . '/calculators/assets/img/buttons/fibank-hover.png';
    }

    /**
     * CartButtons getFibankClasses Doc Comment
     *
     * CartButtons getFibankClasses function,
     *
     * @return object
     */
    public function getFibankClasses()
    {
        $objectManager = \Magento\Framework\App\ObjectManager::getInstance();
        $helper = $objectManager->create(Data::class);
        $useragent =
            $this->_request_http
                ->getServer('HTTP_USER_AGENT') ? $this->_request_http->getServer('HTTP_USER_AGENT') : '';
        $fibank_is_mobile = preg_match('/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i', $useragent) || preg_match('/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i', substr($useragent, 0, 4));
        $classes = [];
        if ($fibank_is_mobile) {
            $classes['fibank_PopUp_Detailed_v1'] = "fibankm_PopUp_Detailed_v1";
            $classes['fibank_Mask'] = "fibankm_Mask";
            $classes['fibank_picture'] =
                $helper->getFibankLiveUrl() .
                '/calculators/assets/img/fibankm' .
                $this->getParamsFibank()->fibank_reklama .
                '.png';
            $classes['fibank_product_name'] = "fibankm_product_name";
            $classes['fibank_body_panel_txt3'] = "fibankm_body_panel_txt3";
            $classes['fibank_body_panel_txt4'] = "fibankm_body_panel_txt4";
            $classes['fibank_body_panel_txt3_left'] = "fibankm_body_panel_txt3_left";
            $classes['fibank_body_panel_txt3_right'] = "fibankm_body_panel_txt3_right";
            $classes['fibank_sumi_panel'] = "fibankm_sumi_panel";
            $classes['fibank_kredit_panel'] = "fibankm_kredit_panel";
            $classes['fibank_kredit_panel_left'] = "fibankm_kredit_panel_left";
            $classes['fibank_body_panel_footer'] = "fibankm_body_panel_footer";
            $classes['fibank_body_panel_left'] = "fibankm_body_panel_left";
        } else {
            $classes['fibank_PopUp_Detailed_v1'] = "fibank_PopUp_Detailed_v1";
            $classes['fibank_Mask'] = "fibank_Mask";
            $classes['fibank_picture'] =
                $helper->getFibankLiveUrl() .
                '/calculators/assets/img/fibank' .
                $this->getParamsFibank()->fibank_reklama .
                '.png';
            $classes['fibank_product_name'] = "fibank_product_name";
            $classes['fibank_body_panel_txt3'] = "fibank_body_panel_txt3";
            $classes['fibank_body_panel_txt4'] = "fibank_body_panel_txt4";
            $classes['fibank_body_panel_txt3_left'] = "fibank_body_panel_txt3_left";
            $classes['fibank_body_panel_txt3_right'] = "fibank_body_panel_txt3_right";
            $classes['fibank_sumi_panel'] = "fibank_sumi_panel";
            $classes['fibank_kredit_panel'] = "fibank_kredit_panel";
            $classes['fibank_kredit_panel_left'] = "fibank_kredit_panel_left";
            $classes['fibank_body_panel_footer'] = "fibank_body_panel_footer";
            $classes['fibank_body_panel_left'] = "fibank_body_panel_left";
        }
        return (object) $classes;
    }

    /**
     * CartButtons getFibankMiniLogo Doc Comment
     *
     * CartButtons getFibankMiniLogo function,
     *
     * @return string
     */
    public function getFibankMiniLogo()
    {
        return $this->getViewFileUrl('Avalon_Mtfibankpayment::images/fibank_mini_logo.png');
    }

    /**
     * CartButtons getFibankMini Doc Comment
     *
     * CartButtons getFibankMini function,
     *
     * @return string
     */
    public function getFibankMini()
    {
        return $this->getViewFileUrl('Avalon_Mtfibankpayment::images/fibank_mini.png');
    }

    /**
     * CartButtons getModuleVersion Doc Comment
     *
     * CartButtons getModuleVersion function,
     *
     * @return string
     */
    public function getModuleVersion()
    {
        $objectManager = \Magento\Framework\App\ObjectManager::getInstance();
        $helper = $objectManager->create(Data::class);
        return $helper->getModuleVersion();
    }
}
