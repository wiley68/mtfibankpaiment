<?php

/**
 * Fibankgetcheckout File Doc Comment
 *
 * PHP version 8
 *
 * @category Fibankgetcheckout
 * @package  Fibankgetcheckout
 * @author   Ilko Ivanov <ilko.iv@gmail.com>
 * @license  http://www.gnu.org/copyleft/gpl.html GNU General Public License
 * @link     https://avalonbg.com/
 */

namespace Avalon\Mtfibankpayment\Controller\Index;

use \Avalon\Mtfibankpayment\Helper\Data;

/**
 * Fibankgetcheckout Class Doc Comment
 *
 * Fibankgetcheckout Class
 *
 * @author   Ilko Ivanov <ilko.iv@gmail.com>
 * @license  http://www.gnu.org/copyleft/gpl.html GNU General Public License
 * @link     https://avalonbg.com/
 */
class Fibankgetcheckout implements \Magento\Framework\App\Action\HttpPostActionInterface
{
    /**
     * @var \Magento\Framework\Controller\Result\JsonFactory $_resultJsonFactory
     */
    protected $_resultJsonFactory;

    /**
     * @var \Magento\Store\Model\StoreManagerInterface
     */
    protected $_storeManager;

    /**
     * @var \Magento\Checkout\Model\Session $checkoutSession
     */
    protected $_checkoutSession;

    /**
     * @var \Magento\Quote\Api\CartRepositoryInterface
     */
    protected $_quoteRepository;

    /**
     * @var \Avalon\Mtfibankpayment\Model\FibankApi
     */
    protected $_fibankApi;

    /**
     * Fibankgetcheckout constructor Doc Comment
     *
     * Fibankgetcheckout Class constructor
     *
     * @param \Magento\Framework\Controller\Result\JsonFactory $resultJsonFactory
     * @param \Magento\Store\Model\StoreManagerInterface $storeManager
     * @param \Magento\Checkout\Model\Session $checkoutSession
     * @param \Magento\Quote\Api\CartRepositoryInterface $quoteRepository
     * @param \Avalon\Mtfibankpayment\Model\FibankApi $fibankApi
     */
    public function __construct(
        \Magento\Framework\Controller\Result\JsonFactory $resultJsonFactory,
        \Magento\Store\Model\StoreManagerInterface $storeManager,
        \Magento\Checkout\Model\Session $checkoutSession,
        \Magento\Quote\Api\CartRepositoryInterface $quoteRepository,
        \Avalon\Mtfibankpayment\Model\FibankApi $fibankApi,
    ) {
        $this->_resultJsonFactory = $resultJsonFactory;
        $this->_storeManager = $storeManager;
        $this->_checkoutSession = $checkoutSession;
        $this->_quoteRepository = $quoteRepository;
        $this->_fibankApi = $fibankApi;
    }

    /**
     * Fibankgetcheckout getCurrentCartId Doc Comment
     *
     * Fibankgetcheckout getCurrentCartId function
     *
     * @return mixed
     */
    public function getCurrentCartId()
    {
        $quoteId = $this->_checkoutSession->getQuote()->getId();
        return $quoteId;
    }

    /**
     * Fibankgetcheckout getGrandTotal Doc Comment
     *
     * Fibankgetcheckout getGrandTotal function
     *
     * @return mixed
     */
    public function getGrandTotal()
    {
        $cartId = $this->getCurrentCartId();
        $quote = $this->_quoteRepository->get($cartId);
        $grandTotal = $quote->getGrandTotal();
        return $grandTotal;
    }

    /**
     * Fibankgetcheckout execute Doc Comment
     *
     * Fibankgetcheckout execute function
     *
     * @return \Magento\Framework\Controller\Result\Json
     */
    public function execute()
    {
        $json = [];
        $objectManager = \Magento\Framework\App\ObjectManager::getInstance();
        $helper = $objectManager->create(Data::class);

        if ($helper->getConfig('avalon_mtfibankpaymentmethod_tab_options/properties_fibank/fibank_cid')) {
            $fibank_cid = $helper->getConfig('avalon_mtfibankpaymentmethod_tab_options/properties_fibank/fibank_cid');
        } else {
            $fibank_cid = "";
        }
        if ($helper->getConfig('avalon_mtfibankpaymentmethod_tab_options/properties_fibank/fibank_status')) {
            $fibank_status =
                $helper->getConfig('avalon_mtfibankpaymentmethod_tab_options/properties_fibank/fibank_status');
        } else {
            $fibank_status = "";
        }

        $fibank_currency_code = $this->_storeManager->getStore()->getCurrentCurrencyCode();

        if ($fibank_status != "1" || ($fibank_currency_code != "EUR" && $fibank_currency_code != "BGN")) {
            $json['fibank_status'] = "No";
        } else {
            $fibankUrl = $helper->getFibankLiveUrl() . '/function/getminmax.php?cid=' . $fibank_cid;
            $response = $this->_fibankApi->fetchData($fibankUrl);
            $paramsfibank = json_decode($response);

            $fibank_price = $this->getGrandTotal();
            $fibank_minstojnost = floatval($paramsfibank->fibank_minstojnost);
            $fibank_maxstojnost = floatval($paramsfibank->fibank_maxstojnost);
            $fibank_status_cp = $paramsfibank->fibank_status;

            $fibank_purcent = floatval($paramsfibank->fibank_purcent);
            $fibank_vnoski_default = (int) $paramsfibank->fibank_vnoski_default;
            if (($fibank_purcent == 0) && ($fibank_vnoski_default <= 6)) {
                $fibank_minstojnost = 100;
            }

            $json['fibank_picture'] =
                $helper->getFibankLiveUrl() .
                '/calculators/assets/img/fibank' .
                $paramsfibank->fibank_reklama .
                '.png';
            $json['fibankm_picture'] =
                $helper->getFibankLiveUrl() .
                '/calculators/assets/img/fibankm' .
                $paramsfibank->fibank_reklama .
                '.png';

            if (
                ($fibank_status_cp == 0) ||
                ($fibank_price < $fibank_minstojnost) ||
                ($fibank_price > $fibank_maxstojnost)
            ) {
                $json['fibank_status'] = "No";
            } else {
                $json['fibank_status'] = "Yes";
            }
        }

        $result = $this->_resultJsonFactory->create();
        $result->setData($json);
        return $result;
    }
}
