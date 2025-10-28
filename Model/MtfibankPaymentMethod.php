<?php

/**
 * MtfibankPaymentMethod File Doc Comment
 *
 * PHP version 8
 *
 * @category MtfibankPaymentMethod
 * @package  MtfibankPaymentMethod
 * @author   Ilko Ivanov <ilko.iv@gmail.com>
 * @license  http://www.gnu.org/copyleft/gpl.html GNU General Public License
 * @link     https://avalonbg.com/
 */

namespace Avalon\Mtfibankpayment\Model;

/**
 * MtfibankPaymentMethod Class Doc Comment
 *
 * MtfibankPaymentMethod Class
 *
 * @author   Ilko Ivanov <ilko.iv@gmail.com>
 * @license  http://www.gnu.org/copyleft/gpl.html GNU General Public License
 * @link     https://avalonbg.com/
 */
class MtfibankPaymentMethod extends \Magento\Payment\Model\Method\AbstractMethod
{
    /**
     * Payment code
     *
     * @var string
     */
    protected $_code = 'mtfibankpaymentmethod';

    /**
     * Availability option
     *
     * @var bool
     */
    protected $_isOffline = true;
}
