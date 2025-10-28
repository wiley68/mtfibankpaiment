<?php

/**
 * Data File Doc Comment
 *
 * PHP version 8
 *
 * @category Data
 * @package  Data
 * @author   Ilko Ivanov <ilko.iv@gmail.com>
 * @license  http://www.gnu.org/copyleft/gpl.html GNU General Public License
 * @link     https://avalonbg.com/
 */

namespace Avalon\Mtfibankpayment\Helper;

/**
 * Data Class Doc Comment
 *
 * Data Class
 *
 * @author   Ilko Ivanov <ilko.iv@gmail.com>
 * @license  http://www.gnu.org/copyleft/gpl.html GNU General Public License
 * @link     https://avalonbg.com/
 */
class Data extends \Magento\Framework\App\Helper\AbstractHelper
{
    /**
     * @var \Magento\Framework\Filesystem
     */
    protected $_filesystem;

    /**
     * @var \Magento\Framework\Filesystem\Io\File
     */
    protected $_io;

    /**
     * @var \Magento\Framework\App\Config\ScopeConfigInterface
     */
    protected $_scopeConfig;

    /**
     * @var \Magento\Store\Model\StoreManagerInterface
     */
    protected $_storeManager;

    /**
     * @var \Magento\Framework\Module\ModuleListInterface
     */
    protected $_moduleList;

    /**
     * @var \Magento\Framework\View\Asset\Repository
     */
    protected $_assetRepository;

    /**
     * Constructor
     *
     * @param \Magento\Framework\Filesystem $filesystem
     * @param \Magento\Framework\Filesystem\Io\File $io
     * @param \Magento\Framework\App\Config\ScopeConfigInterface $scopeConfig
     * @param \Magento\Store\Model\StoreManagerInterface $storeManager
     * @param \Magento\Framework\Module\ModuleListInterface $moduleList
     * @param \Magento\Framework\View\Asset\Repository $assetRepository
     */
    public function __construct(
        \Magento\Framework\Filesystem $filesystem,
        \Magento\Framework\Filesystem\Io\File $io,
        \Magento\Framework\App\Config\ScopeConfigInterface $scopeConfig,
        \Magento\Store\Model\StoreManagerInterface $storeManager,
        \Magento\Framework\Module\ModuleListInterface $moduleList,
        \Magento\Framework\View\Asset\Repository $assetRepository,
    ) {
        $this->_filesystem = $filesystem;
        $this->_io = $io;
        $this->_scopeConfig = $scopeConfig;
        $this->_storeManager = $storeManager;
        $this->_moduleList = $moduleList;
        $this->_assetRepository = $assetRepository;
    }

    /**
     * Data getConfig Doc Comment
     *
     * Data getConfig function,
     *
     * @param mixed $config_path
     *
     * @return string
     */
    public function getConfig($config_path)
    {
        return $this->_scopeConfig->getValue(
            $config_path,
            \Magento\Store\Model\ScopeInterface::SCOPE_STORE
        );
    }

    /**
     * Data getFibankLiveUrl Doc Comment
     *
     * Data getFibankLiveUrl function,
     *
     * @return string
     */
    public function getFibankLiveUrl()
    {
        return 'https://fibank.avalon-bg.eu';
    }

    /**
     * Data getFibankMail Doc Comment
     *
     * Data getFibankMail function,
     *
     * @return string
     */
    public function getFibankMail()
    {
        return 'home@avalonbg.com';
    }

    /**
     * Data readPubKey Doc Comment
     *
     * Data readPubKey function,
     *
     * @return string
     */
    public function readPubKey()
    {
        try {
            if ($this->_io->fileExists($this->getPubPath())) {
                return $this->_io->read($this->getPubPath());
            }
        } catch (\Exception $e) {
            throw new \Magento\Framework\Exception\NoSuchEntityException(
                __($e->getMessage())
            );
        }
    }

    /**
     * Data getModuleVersion Doc Comment
     *
     * Data getModuleVersion function,
     *
     * @return string
     */
    public function getModuleVersion()
    {
        $moduleInfo = $this->_moduleList->getOne('Avalon_Mtfibankpayment');
        return $moduleInfo['setup_version'];
    }

    /**
     * Data getPubPath Doc Comment
     *
     * Data getPubPath function,
     *
     * @return string
     */
    public function getPubPath()
    {
        $assetPub = $this->_assetRepository->createAsset("Avalon_Mtfibankpayment::images/pub.pem");
        return $assetPub->getSourceFile();
    }
}
