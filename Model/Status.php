<?php

/**
 * Status File Doc Comment
 *
 * PHP version 8
 *
 * @category Status
 * @package  Status
 * @author   Ilko Ivanov <ilko.iv@gmail.com>
 * @license  http://www.gnu.org/copyleft/gpl.html GNU General Public License
 * @link     https://avalonbg.com/
 */

namespace Avalon\Mtfibankpayment\Model;

use \Avalon\Mtfibankpayment\Helper\Data;

/**
 * Status Class Doc Comment
 *
 * Status Class
 *
 * @author   Ilko Ivanov <ilko.iv@gmail.com>
 * @license  http://www.gnu.org/copyleft/gpl.html GNU General Public License
 * @link     https://avalonbg.com/
 */
class Status implements \Avalon\Mtfibankpayment\Api\StatusInterface
{
    /**
     * @var \Magento\Framework\App\ResourceConnection $_resorce
     */
    protected $_resorce;

    /**
     * Status constructor Doc Comment
     *
     * Status Class constructor
     *
     * @param \Magento\Framework\App\ResourceConnection $resource
     */
    public function __construct(
        \Magento\Framework\App\ResourceConnection $resource
    ) {
        $this->_resorce = $resource;
    }

    /**
     * Status getConfig Doc Comment
     *
     * Status getConfig function,
     *
     * @param string $order_id
     * @param string $status
     * @param string $calculator_id
     *
     * @return string|false
     */
    public function orderUpdate($order_id, $status, $calculator_id)
    {
        $json = [];
        $json['success'] = 'unsuccess';

        $objectManager = \Magento\Framework\App\ObjectManager::getInstance();
        $helper = $objectManager->create(Data::class);

        if ($helper->getConfig('avalon_mtfibankpaymentmethod_tab_options/properties_fibank/fibank_cid')) {
            $fibank_cid = $helper->getConfig('avalon_mtfibankpaymentmethod_tab_options/properties_fibank/fibank_cid');
        } else {
            $fibank_cid = "";
        }

        if (($calculator_id != '') && ($fibank_cid == $calculator_id)) {
            $connection = $this->_resorce->getConnection();
            $tableName = $connection->getTableName('mtfibank_orders');
            $data = [
                'order_status' => $status
            ];
            $where = ['order_id = ?' => $order_id];
            $connection->update($tableName, $data, $where);
            $json['success'] = 'success';
        }

        $json['order_id'] = $order_id;
        $json['status'] = $status;
        $json['calculator_id'] = $calculator_id;

        return json_encode($json, JSON_UNESCAPED_UNICODE);
    }
}
