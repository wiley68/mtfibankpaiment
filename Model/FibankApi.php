<?php

/**
 * FibankApi File Doc Comment
 *
 * PHP version 8
 *
 * @category FibankApi
 * @package  FibankApi
 * @author   Ilko Ivanov <ilko.iv@gmail.com>
 * @license  http://www.gnu.org/copyleft/gpl.html GNU General Public License
 * @link     https://avalonbg.com/
 */

namespace Avalon\Mtfibankpayment\Model;

/**
 * FibankApi Class Doc Comment
 *
 * FibankApi Class
 *
 * @author   Ilko Ivanov <ilko.iv@gmail.com>
 * @license  http://www.gnu.org/copyleft/gpl.html GNU General Public License
 * @link     https://avalonbg.com/
 */
class FibankApi
{
    /**
     * @var \Magento\Framework\HTTP\Client\Curl $_httpClient
     */
    protected $_httpClient;

    /**
     * FibankApi constructor Doc Comment
     *
     * FibankApi Class constructor
     *
     * @param \Magento\Framework\HTTP\Client\Curl $httpClient
     */
    public function __construct(
        \Magento\Framework\HTTP\Client\Curl $httpClient,
    ) {
        $this->_httpClient = $httpClient;
    }

    /**
     * FibankApi fetchData Doc Comment
     *
     * FibankApi fetchData function
     *
     * @param mixed $url
     *
     * @return string
     */
    public function fetchData($url)
    {
        $this->_httpClient->get($url);
        $response = $this->_httpClient->getBody();

        return $response;
    }
}
