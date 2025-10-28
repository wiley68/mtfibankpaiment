<?php

/**
 * FibankTab File Doc Comment
 *
 * PHP version 8
 *
 * @category FibankTab
 * @package  FibankTab
 * @author   Ilko Ivanov <ilko.iv@gmail.com>
 * @license  http://www.gnu.org/copyleft/gpl.html GNU General Public License
 * @link     https://avalonbg.com/
 */

namespace Avalon\Mtfibankpayment\Block\Adminhtml\Order\View\Tab;

/**
 * FibankTab Class Doc Comment
 *
 * FibankTab Class, The controller that admin panel order Fibank tab
 *
 * @author   Ilko Ivanov <ilko.iv@gmail.com>
 * @license  http://www.gnu.org/copyleft/gpl.html GNU General Public License
 * @link     https://avalonbg.com/
 */
class FibankTab extends \Magento\Backend\Block\Template implements \Magento\Backend\Block\Widget\Tab\TabInterface
{
    /**
     * @var string
     */
    protected $_template = 'Avalon_Mtfibankpayment::order/view/tab/fibank_tab.phtml';

    /**
     * @var \Magento\Framework\Registry
     */
    private $_coreRegistry;

    /**
     * @var \Magento\Framework\App\ResourceConnection $_resorce
     */
    protected $_resorce;

    /**
     * View constructor.
     * @param \Magento\Backend\Block\Template\Context $context
     * @param \Magento\Framework\Registry $registry
     * @param \Magento\Framework\App\ResourceConnection $resource
     * @param array $data
     */
    public function __construct(
        \Magento\Backend\Block\Template\Context $context,
        \Magento\Framework\Registry $registry,
        \Magento\Framework\App\ResourceConnection $resource,
        array $data = []
    ) {
        $this->_coreRegistry = $registry;
        $this->_resorce = $resource;
        parent::__construct($context, $data);
    }

    /**
     * Retrieve order model instance
     *
     * @return \Magento\Sales\Model\Order
     */
    public function getOrder()
    {
        return $this->_coreRegistry->registry('current_order');
    }

    /**
     * Retrieve order model instance
     *
     * @return int
     * Get current id order
     */
    public function getOrderId()
    {
        return $this->getOrder()->getEntityId();
    }

    /**
     * Retrieve order increment id
     *
     * @return string
     */
    public function getOrderIncrementId()
    {
        return $this->getOrder()->getIncrementId();
    }

    /**
     * Retrieve Fibank payment
     *
     * @return bool
     */
    public function checkFibank()
    {
        $connection = $this->_resorce->getConnection();
        $tableName = $connection->getTableName('mtfibank_orders');
        $select = $connection->select()
            ->from(
                ['fo' => $tableName],
                ['id']
            )
            ->where("fo.order_id = :increment_id");
        $bind = ['increment_id' => (string)$this->getOrderIncrementId()];

        if ($connection->fetchRow($select, $bind)) {
            $this->getBoricaData();
            return true;
        }

        return false;
    }

    /**
     * Retrieve payment data
     *
     * @param string $param
     *
     * @return string
     */
    public function getPaymentData(string $param)
    {
        $connection = $this->_resorce->getConnection();
        $tableName = $connection->getTableName('mtfibank_orders');
        $select = $connection->select()
            ->from(
                ['fo' => $tableName],
                ['*']
            )
            ->where("fo.order_id = :increment_id");
        $bind = ['increment_id' => (string)$this->getOrderIncrementId()];

        $row = $connection->fetchRow($select, $bind);

        switch ($param) {
            case 'order_id':
                return $row['order_id'];
            case 'order_status':
                switch ($row['order_status']) {
                    case 0:
                        return "Създадена поръчка";
                    case 1:
                        return "Избран погасителен план";
                    case 2:
                        return "Попълнена заявка";
                    case 3:
                        return "В процес на разглеждане";
                    case 4:
                        return "Одобрена";
                    case 5:
                        return "Отказана";
                    case 6:
                        return "Подписан договор";
                    case 7:
                        return "Изтекъл срок за подпис";
                    default:
                        return "Създадена поръчка";
                }
                break;
            default:
                return $row['order_id'];
        }
    }

    /**
     * @inheritdoc
     */
    public function getTabLabel()
    {
        return 'Fibank Credit поръчки';
    }

    /**
     * @inheritdoc
     */
    public function getTabTitle()
    {
        return 'Fibank Credit покупки на Кредит';
    }

    /**
     * @inheritdoc
     */
    public function canShowTab()
    {
        return true;
    }

    /**
     * @inheritdoc
     */
    public function isHidden()
    {
        return false;
    }
}
