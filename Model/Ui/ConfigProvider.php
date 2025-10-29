<?php

namespace Avalon\Mtfibankpayment\Model\Ui;

use Magento\Checkout\Model\ConfigProviderInterface;
use Magento\Checkout\Model\Session as CheckoutSession;
use Magento\Store\Model\StoreManagerInterface;
use Avalon\Mtfibankpayment\Helper\Data as ModuleHelper;

class ConfigProvider implements ConfigProviderInterface
{
    /** @var CheckoutSession */
    private $checkoutSession;

    /** @var StoreManagerInterface */
    private $storeManager;

    /** @var ModuleHelper */
    private $helper;

    public function __construct(
        CheckoutSession $checkoutSession,
        StoreManagerInterface $storeManager,
        ModuleHelper $helper
    ) {
        $this->checkoutSession = $checkoutSession;
        $this->storeManager = $storeManager;
        $this->helper = $helper;
    }

    public function getConfig()
    {
        $config = [];

        $quote = $this->checkoutSession->getQuote();
        /** @var \Magento\Store\Model\Store $store */
        $store = $this->storeManager->getStore();
        $currencyCode = $store->getCurrentCurrencyCode();

        // Collect common categories across items (same logic as CartButtons::getFibankProductCats)
        $commonCats = null;
        foreach ($quote->getAllItems() as $item) {
            $product = $item->getProduct();
            $cats = $product ? $product->getCategoryIds() : [];
            if ($commonCats === null) {
                $commonCats = $cats;
            } else {
                $commonCats = array_intersect($commonCats, $cats);
            }
            if (empty($commonCats)) {
                $commonCats = ['0'];
                break;
            }
        }
        $categoryIds = !empty($commonCats) ? implode('_', $commonCats) : '0';

        $fibankCid = (string) ($this->helper->getConfig('avalon_mtfibankpaymentmethod_tab_options/properties_fibank/fibank_cid') ?: '');

        // Determine EUR mode via remote endpoint like CartButtons::retrieveEur
        $fibankEur = 0;
        try {
            $fibankUrl = $this->helper->getFibankLiveUrl() . '/function/geteur.php?cid=' . $fibankCid;
            $eurJson = @file_get_contents($fibankUrl);
            if ($eurJson) {
                $eurObj = @json_decode($eurJson);
                if ($eurObj && isset($eurObj->fibank_eur)) {
                    $fibankEur = (int) $eurObj->fibank_eur;
                }
            }
        } catch (\Throwable $e) {
            $fibankEur = 0;
        }

        // Min/Max values to guard popup usage in checkout
        $fibankMax = 0;
        try {
            $minMaxUrl = $this->helper->getFibankLiveUrl() . '/function/getminmax.php?cid=' . $fibankCid;
            $mmJson = @file_get_contents($minMaxUrl);
            if ($mmJson) {
                $mmObj = @json_decode($mmJson);
                if ($mmObj && isset($mmObj->fibank_maxstojnost)) {
                    $fibankMax = (float) $mmObj->fibank_maxstojnost;
                }
            }
        } catch (\Throwable $e) {
            $fibankMax = 0;
        }

        $config['payment']['mtfibankpaymentmethod'] = [
            'fibank_cid' => $fibankCid,
            'fibank_product_cats' => $categoryIds,
            'fibank_live_url' => $this->helper->getFibankLiveUrl(),
            'fibank_eur' => $fibankEur,
            'currency_code' => $currencyCode,
            'fibank_maxstojnost' => $fibankMax,
        ];

        return $config;
    }
}


