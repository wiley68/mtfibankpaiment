<?php

/**
 * Index File Doc Comment
 *
 * PHP version 8
 *
 * @category Index
 * @package  Index
 * @author   Ilko Ivanov <ilko.iv@gmail.com>
 * @license  http://www.gnu.org/copyleft/gpl.html GNU General Public License
 * @link     https://avalonbg.com/
 */

namespace Avalon\Mtfibankpayment\Controller\Index;

/**
 * Index Class Doc Comment
 *
 * Index Class
 *
 * @author   Ilko Ivanov <ilko.iv@gmail.com>
 * @license  http://www.gnu.org/copyleft/gpl.html GNU General Public License
 * @link     https://avalonbg.com/
 */

class Index implements \Magento\Framework\App\Action\HttpPostActionInterface
{
    /**
     * @var \Magento\Sales\Model\OrderFactory
     */
    protected $_resultPageFactory;

    /**
     * Index constructor Doc Comment
     *
     * Index Class constructor
     *
     * @param \Magento\Framework\View\Result\PageFactory $resultPageFactory
     */
    public function __construct(
        \Magento\Framework\View\Result\PageFactory $resultPageFactory
    ) {
        $this->_resultPageFactory = $resultPageFactory;
    }

    /**
     * Index execute Doc Comment
     *
     * Index execute function
     *
     * @return \Magento\Sales\Model\Order
     */
    public function execute()
    {
        $resultPage = $this->_resultPageFactory->create();
        return $resultPage;
    }
}
