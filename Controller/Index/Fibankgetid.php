<?php

/**
 * Fibankgetid File Doc Comment
 *
 * PHP version 8
 *
 * @category Fibankgetid
 * @package  Fibankgetid
 * @author   Ilko Ivanov <ilko.iv@gmail.com>
 * @license  http://www.gnu.org/copyleft/gpl.html GNU General Public License
 * @link     https://avalonbg.com/
 */

namespace Avalon\Mtfibankpayment\Controller\Index;

use \Avalon\Mtfibankpayment\Helper\Data;
use \Avalon\Mtfibankpayment\Helper\Email;

/**
 * Fibankgetid Class Doc Comment
 *
 * Fibankgetid Class
 *
 * @author   Ilko Ivanov <ilko.iv@gmail.com>
 * @license  http://www.gnu.org/copyleft/gpl.html GNU General Public License
 * @link     https://avalonbg.com/
 */
class Fibankgetid implements \Magento\Framework\App\Action\HttpPostActionInterface
{
    /**
     * @var \Magento\Framework\View\Result\PageFactory $_pageFactory
     */
    protected $_pageFactory;

    /**
     * @var \Magento\Framework\Controller\Result\JsonFactory $_resultJsonFactory
     */
    protected $_resultJsonFactory;

    /**
     * @var \Magento\Checkout\Model\Session $_checkoutSession
     */
    protected $_checkoutSession;

    /**
     * @var \Magento\Sales\Model\OrderFactory $_orderFactory
     */
    protected $_orderFactory;

    /**
     * @var string $_order_id
     */
    protected $_order_id;

    /**
     * @var \Magento\Framework\App\RequestInterface
     */
    protected $_request;

    /**
     * @var \Magento\Framework\App\Request\Http
     */
    protected $_request_http;

    /**
     * @var \Magento\Framework\HTTP\Client\Curl
     */
    protected $_curl;

    /**
     * @var \Magento\Framework\App\ResourceConnection $_resorce
     */
    protected $_resorce;

    /**
     * @var \Magento\Store\Model\StoreManagerInterface
     */
    protected $_storeManager;

    /**
     * @var int
     */
    protected $_fibank_eur;

    /**
     * @var \Magento\Framework\App\Config\ScopeConfigInterface
     */
    protected $_scopeConfig;

    /**
     * @var \Avalon\Mtfibankpayment\Model\FibankApi
     */
    protected $_fibankApi;

    /**
     * Fibankgetid constructor Doc Comment
     *
     * Fibankgetid Class constructor
     *
     * @param \Magento\Framework\View\Result\PageFactory $pageFactory
     * @param \Magento\Framework\Controller\Result\JsonFactory $resultJsonFactory
     * @param \Magento\Checkout\Model\Session $checkoutSession
     * @param \Magento\Sales\Model\OrderFactory $orderFactory
     * @param \Magento\Framework\App\RequestInterface $request
     * @param \Magento\Framework\App\Request\Http $request_http
     * @param \Magento\Framework\HTTP\Client\Curl $curl
     * @param \Magento\Framework\App\ResourceConnection $resource
     * @param \Magento\Store\Model\StoreManagerInterface $storeManager
     * @param \Magento\Framework\App\Config\ScopeConfigInterface $scopeConfig
     * @param \Avalon\Fibankpayment\Model\FibankApi $fibankApi
     */
    public function __construct(
        \Magento\Framework\View\Result\PageFactory $pageFactory,
        \Magento\Framework\Controller\Result\JsonFactory $resultJsonFactory,
        \Magento\Checkout\Model\Session $checkoutSession,
        \Magento\Sales\Model\OrderFactory $orderFactory,
        \Magento\Framework\App\RequestInterface $request,
        \Magento\Framework\App\Request\Http $request_http,
        \Magento\Framework\HTTP\Client\Curl $curl,
        \Magento\Framework\App\ResourceConnection $resource,
        \Magento\Store\Model\StoreManagerInterface $storeManager,
        \Magento\Framework\App\Config\ScopeConfigInterface $scopeConfig,
        \Avalon\Mtfibankpayment\Model\FibankApi $fibankApi,
    ) {
        $this->_pageFactory = $pageFactory;
        $this->_resultJsonFactory = $resultJsonFactory;
        $this->_checkoutSession = $checkoutSession;
        $this->_orderFactory = $orderFactory;
        $this->_order_id = $this->getRealOrderId();
        $this->_request = $request;
        $this->_request_http = $request_http;
        $this->_curl = $curl;
        $this->_resorce = $resource;
        $this->_storeManager = $storeManager;
        $this->_scopeConfig = $scopeConfig;
        $this->_fibankApi = $fibankApi;
        $this->_fibank_eur = $this->retrieveEur();
    }

    /**
     * Fibankgetid getEur Doc Comment
     *
     * Fibankgetid getEur function,
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
        $fibankUrl = $helper->getFibankLiveUrl() . '/function/geteur.php?cid=' . $fibank_cid;
        $response = $this->_fibankApi->fetchData($fibankUrl);
        $eurfibank = json_decode($response);
        return (int)$eurfibank->fibank_eur;
    }

    /**
     * Fibankgetid getRealOrderId Doc Comment
     *
     * Fibankgetid getRealOrderId function
     *
     * @return string
     */
    public function getRealOrderId()
    {
        $order = $this->_checkoutSession->getLastRealOrder();
        $orderId = $order->getEntityId();
        return $order->getIncrementId();
    }

    /**
     * Fibankgetid getOrder Doc Comment
     *
     * Fibankgetid getOrder function
     *
     * @return \Magento\Sales\Model\Order
     */
    public function getOrder()
    {
        $order = $this->_orderFactory->create()->loadByIncrementId($this->_order_id);
        return $order;
    }

    /**
     * Fibankgetid getStorename Doc Comment
     *
     * Fibankgetid getStorename function
     *
     * @return string
     */
    public function getStorename()
    {
        return $this->_scopeConfig->getValue(
            'trans_email/ident_general/name',
            \Magento\Store\Model\ScopeInterface::SCOPE_STORE
        );
    }

    /**
     * Fibankgetid getStoreEmail Doc Comment
     *
     * Fibankgetid getStoreEmail function
     *
     * @return string
     */
    public function getStoreEmail()
    {
        return $this->_scopeConfig->getValue(
            'trans_email/ident_general/email',
            \Magento\Store\Model\ScopeInterface::SCOPE_STORE
        );
    }

    /**
     * Fibankgetid execute Doc Comment
     *
     * Fibankgetid execute function
     *
     * @return \Magento\Framework\Controller\Result\Json
     */
    public function execute()
    {
        if ($this->_request->getParam('tag') == 'jLhrHYsfPQ3Gu9JgJPLJ') {
            $objectManager = \Magento\Framework\App\ObjectManager::getInstance();
            $helper = $objectManager->create(Data::class);
            $helper_email = $objectManager->create(Email::class);

            if ($helper->getConfig('avalon_mtfibankpaymentmethod_tab_options/properties_fibank/fibank_cid')) {
                $fibank_cid = $helper->getConfig('avalon_mtfibankpaymentmethod_tab_options/properties_fibank/fibank_cid');
            } else {
                $fibank_cid = "";
            }

            $fibank_mod_version = '';
            $fibank_mod_version = $helper->getModuleVersion();

            if ($this->getOrder()->getBillingAddress() !== null) {
                $billingstreet = $this->getOrder()->getBillingAddress()->getStreet();
            }
            if ($this->getOrder()->getShippingAddress() !== null) {
                $shippingstreet = $this->getOrder()->getShippingAddress()->getStreet();
            }

            $fibank_price = $this->getOrder()->getGrandTotal();

            if ($this->getOrder()->getCustomerId() === null) {
                $fibank_fname =
                    $this->getOrder()
                    ->getBillingAddress() === null ?
                    '' :
                    trim($this->getOrder()->getBillingAddress()->getFirstname(), " ");
                $fibank_lastname =
                    $this->getOrder()
                    ->getBillingAddress() === null ?
                    '' :
                    trim($this->getOrder()->getBillingAddress()->getLastname(), " ");
            } else {
                $fibank_fname = trim($this->getOrder()->getCustomerFirstname(), " ");
                $fibank_lastname = trim($this->getOrder()->getCustomerLastname(), " ");
            }

            $fibank_phone =
                $this->getOrder()
                ->getBillingAddress() === null ?
                '' :
                $this->getOrder()->getBillingAddress()->getTelephone();
            $fibank_email = $this->getOrder()->getCustomerEmail();
            $fibank_billing_address_1 = isset($billingstreet[0]) ? $billingstreet[0] : '';
            $fibank_billing_city =
                $this->getOrder()
                ->getBillingAddress() === null ?
                '' :
                $this->getOrder()->getBillingAddress()->getCity();
            $fibank_shipping_address_1 = isset($shippingstreet[0]) ? $shippingstreet[0] : '';
            $fibank_shipping_city =
                $this->getOrder()
                ->getShippingAddress() === null ?
                '' :
                $this->getOrder()->getShippingAddress()->getCity();
            $fibank_billing_postcode = '';

            $fibank_currency_code = $this->_storeManager->getStore()->getCurrentCurrencyCode();
            $fibank_currency_code_send = 'BGN';
            switch ($this->_fibank_eur) {
                case 0:
                    break;
                case 1:
                    $fibank_currency_code_send = 'BGN';
                    if ($fibank_currency_code == "EUR") {
                        $fibank_price = number_format($fibank_price * 1.95583, 2, ".", "");
                    }
                    break;
                case 2:
                case 3:
                    $fibank_currency_code_send = 'EUR';
                    if ($fibank_currency_code == "BGN") {
                        $fibank_price = number_format($fibank_price / 1.95583, 2, ".", "");
                    }
                    break;
            }

            $products_id = '';
            $products_name = '';
            $products_q = '';
            $products_p = '';
            $products_c = '';
            $products_m = '';
            $products_i = '';
            foreach ($this->getOrder()->getAllVisibleItems() as $cart_item) {
                $fibank_product = $cart_item->getProduct();
                $products_id .= $cart_item->getProductId();
                $products_id .= '_';
                $products_q .= $cart_item->getQtyOrdered();
                $products_q .= '_';
                $products_p_temp = $cart_item->getPrice();
                switch ($this->_fibank_eur) {
                    case 0:
                        break;
                    case 1:
                        if ($fibank_currency_code == "EUR") {
                            $products_p_temp = number_format($products_p_temp * 1.95583, 2, ".", "");
                        }
                        break;
                    case 2:
                    case 3:
                        if ($fibank_currency_code == "BGN") {
                            $products_p_temp = number_format($products_p_temp / 1.95583, 2, ".", "");
                        }
                        break;
                }
                $products_p .= $products_p_temp;
                $products_p .= '_';
                $products_name .=
                    str_replace(
                        '"',
                        '',
                        str_replace("'", "", htmlspecialchars_decode($fibank_product['name'], ENT_QUOTES))
                    );
                $products_name .= '_';
                $cats = $fibank_product->getCategoryIds();
                $fibank_product_cats = '';
                foreach ($cats as $cat_id) {
                    $fibank_product_cats .= $cat_id . ':';
                }
                $fibank_product_cats = rtrim($fibank_product_cats, ':');
                $products_c .= $fibank_product_cats;
                $products_c .= '_';
                $products_m .= $fibank_product->getAttributeText('manufacturer');
                $products_m .= '_';
                //$helperImport = $this->_objectManager->get('\Magento\Catalog\Helper\Image');
                //$fibank_image =
                //$helperImport->init($fibank_product, 'product_page_image_large')
                //->setImageFile($fibank_product->getFile())
                //->getUrl();
                //$fibank_imagePath = isset($fibank_image) ? $fibank_image : '';
                $fibank_imagePath = '#';
                $fibank_imagePath_64 = base64_encode($fibank_imagePath);
                $products_i .= $fibank_imagePath_64;
                $products_i .= '_';
            }
            $products_id = trim($products_id, "_");
            $products_q = trim($products_q, "_");
            $products_p = trim($products_p, "_");
            $products_c = trim($products_c, "_");
            $products_m = trim($products_m, "_");
            $products_name = trim($products_name, "_");
            $products_i = trim($products_i, "_");

            $useragent =
                $this->_request_http
                ->getServer('HTTP_USER_AGENT') ? $this->_request_http->getServer('HTTP_USER_AGENT') : '';
            if (preg_match('/(android|bb\d+|meego).+mobile|avantgo|bada\/|blackberry|blazer|compal|elaine|fennec|hiptop|iemobile|ip(hone|od)|iris|kindle|lge |maemo|midp|mmp|netfront|opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\/|plucker|pocket|psp|series(4|6)0|symbian|treo|up\.(browser|link)|vodafone|wap|windows (ce|phone)|xda|xiino/i', $useragent) || preg_match('/1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\-(n|u)|c55\/|capi|ccwa|cdm\-|cell|chtm|cldc|cmd\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\-s|devi|dica|dmob|do(c|p)o|ds(12|\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\-|_)|g1 u|g560|gene|gf\-5|g\-mo|go(\.w|od)|gr(ad|un)|haie|hcit|hd\-(m|p|t)|hei\-|hi(pt|ta)|hp( i|ip)|hs\-c|ht(c(\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\-(20|go|ma)|i230|iac( |\-|\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\/)|klon|kpt |kwc\-|kyo(c|k)|le(no|xi)|lg( g|\/(k|l|u)|50|54|\-[a-w])|libw|lynx|m1\-w|m3ga|m50\/|ma(te|ui|xo)|mc(01|21|ca)|m\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\-2|po(ck|rt|se)|prox|psio|pt\-g|qa\-a|qc(07|12|21|32|60|\-[2-7]|i\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\-|oo|p\-)|sdk\/|se(c(\-|0|1)|47|mc|nd|ri)|sgh\-|shar|sie(\-|m)|sk\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\-|v\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\-|tdg\-|tel(i|m)|tim\-|t\-mo|to(pl|sh)|ts(70|m\-|m3|m5)|tx\-9|up(\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\-|your|zeto|zte\-/i', substr($useragent, 0, 4))) {
                $fibank_type_client = 1;
            } else {
                $fibank_type_client = 0;
            }

            $fibank_currency_code = $this->_storeManager->getStore()->getCurrentCurrencyCode();

            $fibank_post = [
                'unicid'            => $fibank_cid,
                'first_name'        => $fibank_fname,
                'last_name'            => $fibank_lastname,
                'phone'                => $fibank_phone,
                'email'                => $fibank_email,
                'address2'            => str_replace(
                    '"',
                    '',
                    str_replace(
                        "'",
                        "",
                        htmlspecialchars_decode($fibank_billing_address_1, ENT_QUOTES)
                    )
                ),
                'address2city'        => str_replace(
                    '"',
                    '',
                    str_replace(
                        "'",
                        "",
                        htmlspecialchars_decode($fibank_billing_city, ENT_QUOTES)
                    )
                ),
                'postcode'            => $fibank_billing_postcode,
                'price'                => $fibank_price,
                'address'            => str_replace(
                    '"',
                    '',
                    str_replace(
                        "'",
                        "",
                        htmlspecialchars_decode($fibank_shipping_address_1, ENT_QUOTES)
                    )
                ),
                'addresscity'        => str_replace(
                    '"',
                    '',
                    str_replace(
                        "'",
                        "",
                        htmlspecialchars_decode($fibank_shipping_city, ENT_QUOTES)
                    )
                ),
                'products_id'        => $products_id,
                'products_name'        => $products_name,
                'products_q'        => $products_q,
                'type_client'        => $fibank_type_client,
                'products_p'        => $products_p,
                'version'             => $fibank_mod_version,
                'shoporder_id'        => $this->_order_id,
                'products_c'        => $products_c,
                'products_m'        => $products_m,
                'products_i'        => $products_i,
                'currency'          => $fibank_currency_code_send
            ];

            $fibank_plaintext = json_encode($fibank_post);
            $fibank_publicKey = openssl_pkey_get_public($helper->readPubKey());
            $fibank_a_key = openssl_pkey_get_details($fibank_publicKey);
            $fibank_chunkSize = ceil($fibank_a_key['bits'] / 8) - 11;
            $fibank_output = '';
            while ($fibank_plaintext) {
                $fibank_chunk = substr($fibank_plaintext, 0, $fibank_chunkSize);
                $fibank_plaintext = substr($fibank_plaintext, $fibank_chunkSize);
                $fibank_encrypted = '';
                openssl_public_encrypt($fibank_chunk, $fibank_encrypted, $fibank_publicKey);
                $fibank_output .= $fibank_encrypted;
            }
            if (version_compare(PHP_VERSION, '8.0.0', '<')) {
                openssl_free_key($fibank_publicKey);
            }
            $fibank_output64 = base64_encode($fibank_output);

            // Create fibank order i data base
            $this->_curl->setOption(CURLOPT_SSL_VERIFYPEER, false);
            $this->_curl->setOption(CURLOPT_RETURNTRANSFER, true);
            $this->_curl->setOption(CURLOPT_MAXREDIRS, 2);
            $this->_curl->setOption(CURLOPT_TIMEOUT, 5);
            $this->_curl->setOption(CURLOPT_HTTP_VERSION, CURL_HTTP_VERSION_1_1);
            $this->_curl->setOption(CURLOPT_ENCODING, "");
            $this->_curl->setOption(CURLOPT_CUSTOMREQUEST, 'POST');
            $this->_curl->post(
                $helper->getFibankLiveUrl() .
                    '/function/addorders.php',
                json_encode(['data' => $fibank_output64])
            );
            $this->_curl->addHeader("Content-Type", "application/json");
            $this->_curl->addHeader("Content-Length", strlen(json_encode(['data' => $fibank_output64])));
            $response = $this->_curl->getBody();
            $paramsfibankadd = json_decode($response, true);

            if ((!empty($paramsfibankadd)) &&
                isset($paramsfibankadd['order_id']) &&
                ($paramsfibankadd['order_id'] != 0)
            ) {
                $connection = $this->_resorce->getConnection();
                $tableName = $connection->getTableName('mtfibank_orders');
                $data = [
                    'order_id' => $this->_order_id,
                    'order_status' => 0
                ];
                $connection->insert($tableName, $data);

                if ($fibank_type_client == 1) {
                    $redirectpath =
                        $helper->getFibankLiveUrl() .
                        '/applicationm_step1.php?oid=' .
                        $paramsfibankadd['order_id'] .
                        '&cid=' .
                        $fibank_cid;
                } else {
                    $redirectpath =
                        $helper->getFibankLiveUrl() .
                        '/application_step1.php?oid=' .
                        $paramsfibankadd['order_id'] .
                        '&cid=' .
                        $fibank_cid;
                }

                $status = 1;
                $fibankreturn = $redirectpath;
                $fibank_send_mail = 0;
            } else {
                if (empty($paramsfibankadd)) {
                    $connection = $this->_resorce->getConnection();
                    $tableName = $connection->getTableName('mtfibank_orders');
                    $data = [
                        'order_id' => $this->_order_id,
                        'order_status' => 0
                    ];
                    $connection->insert($tableName, $data);

                    $helper_email->sendEmail(
                        $this->getStorename(),
                        $this->getStoreEmail(),
                        'Проблем комуникация заявка КП Fibank Credit',
                        json_encode($fibank_post, JSON_PRETTY_PRINT | JSON_UNESCAPED_UNICODE),
                        $helper->getFibankMail()
                    );

                    $status = 1;
                    $fibank_send_mail = 1;
                    $fibankreturn = "";
                } else {
                    $status = 0;
                    $fibankreturn = "";
                    $fibank_send_mail = 0;
                }
            }
        } else {
            $status = 0;
            $fibankreturn = "";
            $fibank_send_mail = 0;
        }

        $result = $this->_resultJsonFactory->create();
        $result->setData([
            'msg_status' => $status,
            'fibankreturn' => $fibankreturn,
            'fibank_send_mail' => $fibank_send_mail
        ]);
        return $result;
    }
}
