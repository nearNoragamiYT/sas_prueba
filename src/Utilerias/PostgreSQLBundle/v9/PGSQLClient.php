<?php

/**
 * V1.1
 * First version of PHP - PostgreSQL Version
 * 2015-01-18
 * @author Diego Osorno <diegoc@infoexpo.com.mx>
 *
 *
 * V1.2
 * Change the way of how to get the DataBase information, now it's get from ConfigurationBundle
 * Add function to return a positive response successResponse()
 * Alter errorResult() into errorResponse()
 * Use errorResponse only for the result of the exec()
 * 2015-02-04
 * @author Diego Osorno <diegoc@infoexpo.com.mx>
 *
 * V1.3
 * Add getParameterType() function
 * When a parameter type is not defined in setBindParameters(), the getParameterType is used
 * Delete getSchema(), setSchema(), eraseSchema()
 * Change the scope of setDBConfig() from public to private
 * Change the name of setDBConfig() to setDBConfigByContainerParameter()
 * Add updateDBConfig()
 * Add getDBConfig()
 * 2015-03-18
 * @author Diego Osorno <diegoc@infoexpo.com.mx>
 *
 * V1.4
 * Add ṕrivate bindParameter() function
 * Add suport to use {columns} and {values} label to build the INSERT Query String
 * Add suport to add {returning} label to build a RETURNING expresion to INSERT and Update Query Strings
 * Add Suport to specify an empty $paramaters array on setQueryParameters(), the API will omit the WHERE clause in the Query String
 * 2015-04-13
 * @author Diego Osorno <diegoc@infoexpo.com.mx>
 *
 * V1.5
 * Change STR error_msg to Array with message, sqlstate_code, driver_code, string(concat all) elements
 * 2015-04-29
 * @author Diego Osorno <diegoc@infoexpo.com.mx>
 *
 * V1.5.1
 * Add "->", ">", "'" to invalid_parameter_chars array
 * 2015-07-06
 * @author Diego Osorno <diegoc@infoexpo.com.mx>
 *
 *
 */

namespace Utilerias\PostgreSQLBundle\v9;

use Symfony\Component\DependencyInjection\ContainerBuilder;
use Symfony\Component\Config\FileLocator;
use Symfony\Component\DependencyInjection\Loader\YamlFileLoader;

error_reporting(E_ALL & ~E_NOTICE & ~E_DEPRECATED & ~E_STRICT & ~E_WARNING);
ini_set('memory_limit', '128M');

class PGSQLClient
{

    private $conn, $container;
    private $required_parameter_values = array("name", "value");
    private $required_associate_value = array("operator");
    private $db_config_parameters = array("db_name", "db_schema", "db_user", "db_password", "db_server", "db_port");
    private $associate = array("columns" => FALSE, "values" => FALSE, "set" => FALSE, "where" => FALSE);
    private $invalid_parameter_chars = array("\"", ".", "->", ">", "'");

    /**
     * Creates a PGSQLClient instance
     * @param string $db
     */
    public function __construct($db_data = NULL)
    {
        if (!$db_data) {
            $db_prefix = "PGSQL_TEST";
            $this->container = new ContainerBuilder();
            $loader = new YamlFileLoader($this->container, new FileLocator(__DIR__ . "/../../../../app/config"));
            $loader->load('parameters.yml');
            $db_data = $this->container->getParameter($db_prefix);
        }
        /*$request_uri = $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
        if (!strstr($request_uri, 'localhost') && $db_data['db_server'] == "hd3.infoexpo.com.mx") {
            $db_data['db_server'] = "localhost";
        }*/
        $this->setDBConfigByContainerParameter($db_data);
    }

    /**
     * Set Postgres DataBase Configuration based in parameters.yml
     * @param string $db_prefix
     * @return void
     */
    private function setDBConfigByContainerParameter($db_data = "")
    {
        /* if (!is_string($db_prefix) || $db_prefix === "") {
          throw new \Exception("You must to specify a DataBase Prefix to Connect with PostgreSQL");
          }
          $db_data = $this->container->getParameter($db_prefix); */
        $this->conn = array("db_info" => $db_data, "conn_object" => NULL, "statement_object" => NULL, "query" => array("string" => "", "parameters" => array()));
    }

    /**
     * Update Postgres DataBase Configuration
     * @param array $db_config
     * @return void
     */
    public function updateDBConfig(array $db_config = array())
    {
        if (!is_array($db_config) && COUNT($db_config) == 0) {
            throw new \Exception("You must to specify a valid DataBase Cofig to Update Main Config");
        }
        foreach ($db_config as $key => $value) {
            if (in_array($key, $this->db_config_parameters) && is_string($value)) {
                $this->conn["db_info"][$key] = $value;
            }
        }
    }

    /**
     * Returns current Postgres DataBase Configuration
     * @return array with the following fields:
     * db_name
     * db_schema
     * db_user
     * db_password
     * db_server
     * db_port
     */
    public function getDBConfig()
    {
        return $this->conn["db_info"];
    }

    /**
     * Connect to Postgres DataBase server
     * @return array with the following fields:
     * status (TRUE, FALSE)
     * error (string with last error)
     */
    private function connect()
    {
        $this->conn["conn_string"] = "pgsql:host={$this->conn["db_info"]['db_server']};dbname={$this->conn["db_info"]["db_name"]};port={$this->conn["db_info"]['db_port']}";
        try {
            $this->conn["conn_object"] = new \PDO($this->conn["conn_string"], $this->conn["db_info"]['db_user'], $this->conn["db_info"]['db_password']);
            return array("status" => TRUE, "error" => "");
        } catch (\PDOException $e) {
            return array("status" => FALSE, "error" => $e->getMessage());
        }
    }

    /**
     * Close connection to Postgres DataBase server
     */
    private function closeConn()
    {
        $this->conn["query"] = array("string" => "", "parameters" => array());
        $this->conn["conn_object"] = NULL;
        $this->conn["statement_object"] = NULL;
        $this->associate = array("columns" => FALSE, "values" => FALSE, "set" => FALSE, "where" => FALSE);
    }

    /**
     * Set Query Stringi
     * @param string $query
     * @return array with the following fields:
     * status (TRUE, FALSE)
     * error (string with last error)
     */
    public function setQuery($query = "")
    {
        if (!is_string($query) || $query == "" || $query == NULL) {
            return array("status" => FALSE, "error" => "You must to specify a valid Query String");
        }
        $this->conn["query"]["string"] = $query;
        return array("status" => TRUE, "error" => "");
    }

    /**
     * Get Query String
     */
    public function getQuery()
    {
        return $this->conn["query"]["string"];
    }

    /**
     * Get the type of a specific Parameter Type, based on its value
     * @param array $value
     * @return \PDO::PARAM_TYPE
     */
    public function getParameterType($value = "")
    {
        switch (gettype($value)) {
            case "boolean":
                return \PDO::PARAM_BOOL;
            case "integer":
                return \PDO::PARAM_INT;
            case "string":
                return \PDO::PARAM_STR;
            case "null":
                return \PDO::PARAM_NULL;
            default:
                return \PDO::PARAM_STR;
        }
    }

    /**
     * Set Query Parameters
     * @param array $parameters
     * @return array with the following fields:
     * status (TRUE, FALSE)
     * error (string with last error)
     */
    public function setQueryParameters(array $parameters = array())
    {

        if ($this->conn["query"]["string"] == "") {
            return array("status" => FALSE, "error" => "You must to specify a Query String before Set Parameters");
        }

        if (!is_array($parameters)) {
            return array("status" => FALSE, "error" => "You must to specify a valid Query Parameters Array");
        }

        $this->conn["query"]["parameters"] = array();

        $this->associate["set"] = strpos($this->conn["query"]["string"], "{set}") ? TRUE : FALSE;
        if ($this->associate["set"]) {
            if (!array_key_exists("set", $parameters) || COUNT($parameters["set"]) == 0) {
                return array("status" => FALSE, "error" => "You must to especify <b>'set'</b> sub-arrays into parameters AND it needs to have at least one element");
            }

            $this->conn["query"]["parameters"]["set"] = array();
            foreach ($parameters["set"] as $parameter) {
                foreach ($this->required_parameter_values as $required_value) {
                    if (!array_key_exists($required_value, $parameter)) {
                        return array("status" => FALSE, "error" => "Update Parameter: $parameter is missing: <b>$required_value</b>");
                    }
                }
                array_push($this->conn["query"]["parameters"]["set"], $parameter);
            }
        } else {
            if (array_key_exists("set", $parameters)) {
                return array("status" => FALSE, "error" => "You must to specify <b>{set}</b> label inside Query String because a <b>'set'</b> sub-array was specified into parameters");
            }
        }

        $this->associate["where"] = strpos($this->conn["query"]["string"], "{where}") ? TRUE : FALSE;
        if ($this->associate["where"]) {
            $this->conn["query"]["parameters"]["where"] = array();

            if (!array_key_exists("where", $parameters) || COUNT($parameters["where"]) == 0) {
                //return Array("status" => FALSE, "error" => "You must to especify <b>'where'</b> sub-arrays into parameters AND it needs to have at least one element");
            } else {
                foreach ($parameters["where"] as $parameter) {
                    foreach ($this->required_parameter_values as $required_value) {
                        if (!array_key_exists($required_value, $parameter)) {
                            $parameter_name = array_key_exists("name", $parameter) ? $parameter["name"] : "undefined";
                            return array("status" => FALSE, "error" => "Condition Parameter <b>$parameter_name</b> is missing: <b>$required_value</b>");
                        }
                    }
                    array_push($this->conn["query"]["parameters"]["where"], $parameter);
                }
            }
        } else {
            if (array_key_exists("where", $parameters)) {
                return array("status" => FALSE, "error" => "You must to specify <b>{where}</b> label inside the Query String because a <b>'where'</b> sub-array was specified into parameters");
            }
        }

        if (!$this->associate["set"] && !$this->associate["where"]) {

            $this->associate["columns"] = strpos($this->conn["query"]["string"], "{columns}") ? TRUE : FALSE;
            $this->associate["values"] = strpos($this->conn["query"]["string"], "{values}") ? TRUE : FALSE;

            if ($this->associate["columns"] && !$this->associate["values"]) {
                //no {values} specified
                return array("status" => FALSE, "error" => "You must to specify <b>{values}</b> label inside the Query String because a <b>{columns}</b> was specified");
            } elseif (!$this->associate["columns"] && $this->associate["values"]) {
                //no {columns} specified
                return array("status" => FALSE, "error" => "You must to specify <b>{columns}</b> label inside the Query String because a <b>{values}</b> was specified");
            } elseif ($this->associate["columns"] && $this->associate["values"]) {
                if (COUNT($parameters) == 0) {
                    return array("status" => FALSE, "error" => "You must to specify at least one element in the Query Parameters");
                }

                $this->conn["query"]["parameters"]["columns"] = array();
                $this->conn["query"]["parameters"]["values"] = array();

                foreach ($parameters as $parameter) {
                    foreach ($this->required_parameter_values as $required_value) {
                        if (!array_key_exists($required_value, $parameter)) {
                            $parameter_name = array_key_exists("name", $parameter) ? $parameter["name"] : "undefined";
                            return array("status" => FALSE, "error" => "Condition Parameter <b>$parameter_name</b> is missing: <b>$required_value</b>");
                        }
                    }
                    array_push($this->conn["query"]["parameters"]["columns"], trim($parameter["name"]));
                    array_push($this->conn["query"]["parameters"]["values"], $parameter);
                }
            } else {
                foreach ($parameters as $parameter) {
                    foreach ($this->required_parameter_values as $required_value) {
                        if (!array_key_exists($required_value, $parameter)) {
                            $parameter_name = array_key_exists("name", $parameter) ? $parameter["name"] : "undefined";
                            return array("status" => FALSE, "error" => "Condition Parameter <b>$parameter_name</b> is missing: <b>$required_value</b>");
                        }
                    }
                    array_push($this->conn["query"]["parameters"], $parameter);
                }
            }
        }
        return array("status" => TRUE, "error");
    }

    /**
     * Get Query Parameters
     * @return array $parameters
     */
    public function getQueryParameters()
    {
        return $this->conn["query"]["parameters"];
    }

    /**
     * Associate Parameters ( SET, WHERE ) to Query String
     * @return array with the following fields:
     * status (TRUE, FALSE)
     * error (string with last error)
     */
    private function associateParameters()
    {

        if ($this->associate["set"]) {
            $update_parameters = " SET ";
            foreach ($this->conn["query"]["parameters"]["set"] as $parameter) {
                $parameter_raw_name = ':' . str_replace($this->invalid_parameter_chars, "", $parameter["name"]);
                $update_parameters .= trim($parameter["name"]) . ' = ' . trim($parameter_raw_name) . ', ';
            }
            $update_parameters = substr($update_parameters, 0, -2);
            $this->conn["query"]["string"] = str_replace("{set}", $update_parameters, $this->conn["query"]["string"]);
        }

        if ($this->associate["where"]) {
            $where_parameters = "";

            if (COUNT($this->conn["query"]["parameters"]["where"]) > 0) {
                $where_parameters = " WHERE ";
                foreach ($this->conn["query"]["parameters"]["where"] as $parameter) {
                    foreach ($this->required_associate_value as $associate_value) {
                        if (!array_key_exists($associate_value, $parameter)) {
                            $parameter_name = array_key_exists("name", $parameter) ? $parameter["name"] : "undefined";
                            return array("status" => FALSE, "error" => "Parameter <b>$parameter_name</b> is missing <b>$associate_value</b>");
                        }
                    }
                    if (array_key_exists("clause", $parameter) && $parameter["clause"] != "") {
                        $where_parameters .= " {$parameter["clause"]} ";
                    }
                    $parameter_raw_name = ':' . str_replace($this->invalid_parameter_chars, "", $parameter["name"]);
                    $where_parameters .= $parameter["name"] . " " . $parameter["operator"] . " " . $parameter_raw_name;
                }
            }
            $this->conn["query"]["string"] = str_replace("{where}", $where_parameters, $this->conn["query"]["string"]);
        }

        if ($this->associate["columns"] && $this->associate["values"]) {
            $colmns_parameters = " (";
            foreach ($this->conn["query"]["parameters"]["columns"] as $column) {
                if (strpos('"', $column) == FALSE) {
                    $colmns_parameters .= '"' . $column . '", ';
                } else {
                    $colmns_parameters .= $column . ", ";
                }
            }
            $colmns_parameters = substr($colmns_parameters, 0, -2) . ") ";
            $this->conn["query"]["string"] = str_replace("{columns}", $colmns_parameters, $this->conn["query"]["string"]);

            $values_parameters = " VALUES (";
            foreach ($this->conn["query"]["parameters"]["values"] as $parameter) {
                $parameter_raw_name = ':' . str_replace($this->invalid_parameter_chars, "", $parameter["name"]);
                $values_parameters .= $parameter_raw_name . " , ";
            }
            $values_parameters = substr($values_parameters, 0, -2) . ") ";

            $this->conn["query"]["string"] = str_replace("{values}", $values_parameters, $this->conn["query"]["string"]);
        }

        if (strpos($this->conn["query"]["string"], "{returning}") != FALSE) {
            $returning_string = " RETURNING ";

            if ($this->associate["set"]) {
                foreach ($this->conn["query"]["parameters"]["set"] as $parameter) {
                    if (strpos($parameter["name"], '"') === FALSE) {
                        $returning_string .= '"' . trim($parameter["name"]) . '", ';
                    } else {
                        $returning_string .= trim($parameter["name"]) . ", ";
                    }
                }
            } elseif ($this->associate["columns"]) {
                foreach ($this->conn["query"]["parameters"]["columns"] as $column) {
                    if (strpos($column, '"') == FALSE) {
                        $returning_string .= '"' . $column . '", ';
                    } else {
                        $returning_string .= $column . ", ";
                    }
                }
            } else {
                return array("status" => TRUE, "error" => "You must to specify a {column} or {set} label to build the returning expression");
            }

            $returning_string = substr($returning_string, 0, -2);
            $this->conn["query"]["string"] = str_replace("{returning}", $returning_string, $this->conn["query"]["string"]);
        }

        return array("status" => TRUE, "error" => "");
    }

    /**
     * Binds Parameters to /PDO::Statement instance
     * @return array with the following fields:
     * status (TRUE, FALSE)
     * error (string with last error)
     */
    private function setBindParameters()
    {
        if ($this->associate["set"]) {
            foreach ($this->conn["query"]["parameters"]["set"] as $parameter) {
                $result_bind = $this->bindParameter($parameter);
                if (!$result_bind["status"]) {
                    return $result_bind;
                }
            }
        }

        if ($this->associate["where"]) {
            if (COUNT($this->conn["query"]["parameters"]["where"]) > 0) {
                foreach ($this->conn["query"]["parameters"]["where"] as $parameter) {
                    $result_bind = $this->bindParameter($parameter);
                    if (!$result_bind["status"]) {
                        return $result_bind;
                    }
                }
            }
        }

        if (!$this->associate["set"] && !$this->associate["where"]) {
            if ($this->associate["columns"] && $this->associate["values"]) {
                foreach ($this->conn["query"]["parameters"]["values"] as $parameter) {
                    $result_bind = $this->bindParameter($parameter);
                    if (!$result_bind["status"]) {
                        return $result_bind;
                    }
                }
            } else {
                foreach ($this->conn["query"]["parameters"] as $parameter) {
                    $result_bind = $this->bindParameter($parameter);
                    if (!$result_bind["status"]) {
                        return $result_bind;
                    }
                }
            }
        }

        return array("status" => TRUE, "error" => "");
    }

    /**
     * Bind  Specific Parameter to Statement Object
     * @param array $parameter
     * @return array with the following fields:
     * status (TRUE, FALSE)
     * error (string with last error)
     */
    private function bindParameter(array $parameter = array())
    {
        $parameter_raw_name = ':' . str_replace($this->invalid_parameter_chars, "", $parameter["name"]);
        $parameter_value = ($parameter["value"] == "") ? NULL : $parameter["value"];
        $type = (isset($parameter["type"])) ? $parameter["type"] : $this->getParameterType($parameter["value"]);
        $result_bind = $this->conn["statement_object"]->bindParam($parameter_raw_name, $parameter_value, $type);
        if (!$result_bind) {
            return array("status" => FALSE, "error" => "Error <b>{$this->conn["statement_object"]->errorCode()}</b> trying to Bind <b>{$parameter["name"]}</b>, make sure that you include it into the Query String");
        }
        return array("status" => TRUE);
    }

    /**
     * Prepare Query string AND Bind Query Parameters
     * @return array with the following fields:
     * status (TRUE, FALSE)
     * error (string with last error)
     */
    private function prepareQuery()
    {
        if ($this->conn["query"]["string"] == "") {
            return array("status" => FALSE, "error" => "Query String is empty");
        }

        if ($this->associate["set"] || $this->associate["where"] || $this->associate["columns"] || $this->associate["values"]) {
            $result_associate = $this->associateParameters();
            if (!$result_associate["status"]) {
                return $result_associate;
            }
        }

        if (strpos($this->conn["query"]["string"], "{schema}") != FALSE && is_string($this->conn["db_info"]["db_schema"]) && $this->conn["db_info"]["db_schema"] != "") {
            $this->conn["query"]["string"] = str_replace("{schema}", '"' . $this->conn["db_info"]["db_schema"] . '"', $this->conn["query"]["string"]);
        }

        $this->conn["statement_object"] = $this->conn["conn_object"]->prepare($this->conn["query"]["string"]);

        if (!$this->conn["statement_object"]) {
            $array_error = $this->conn["conn_object"]->errorInfo();
            $error = array("string" => "Internal Error while trying to execute Query");
            if (is_array($array_error) && COUNT($array_error) > 0) {
                $error = array(
                    "string" => "SQLSTATE error code -- " . $array_error[0] . " <br>Driver-specific error code -- " . $array_error[1] . " <br>Driver-specific error message -- " . $array_error[2],
                    "message" => $array_error[2],
                    "sqlstate_code" => $array_error[0],
                    "driver_code" => $array_error[1]
                );
            }
            return array("status" => FALSE, "error" => $error);
        }
        if (COUNT($this->conn["query"]["parameters"]) > 0) {
            $result_bind = $this->setBindParameters();
            if (!$result_bind["status"]) {
                return $result_bind;
            }
        }
        return array("status" => TRUE, "error" => "");
    }

    /**
     * Execute Query String AND Bind Query Parameters
     * @return array with the following fields:
     * status (TRUE, FALSE)
     * data (Fetch data from executing the specified query string)
     * error (string with last error)
     */
    public function exec()
    {
        $result_connect = $this->connect();
        if (!$result_connect["status"]) {
            return $this->errorResponse(array("message" => $result_connect["error"]));
        }

        $result_prepare = $this->prepareQuery();
        if (!$result_prepare["status"]) {
            return $this->errorResponse($result_prepare["error"]);
        }

        if (array_key_exists("db_schema", $this->conn["db_info"]) && is_string($this->conn["db_info"]["db_schema"]) && strpos($this->conn["query"]["string"], $this->conn["db_info"]["db_schema"]) === FALSE) {
            $error = array(
                "string" => "It looks that you forgot to add the Schema name(<b>{$this->conn["db_info"]["db_schema"]}</b>) to the query String",
                "message" => $array_error[2],
                "sqlstate_code" => -1,
                "driver_code" => -1
            );
            return $this->errorResponse($error);
        }

        $attempt = 0;
        query_execution:
        $result_execute = $this->conn["statement_object"]->execute();
        if ($result_execute == FALSE) {
            if (++$attempt < 3) {
                sleep(200 / 1000 /* ms */);
                goto query_execution;
            }
            $array_error = $this->conn["statement_object"]->errorInfo();

            if (isset($array_error[2])) {
                $error_tmp = explode("\n", $array_error[2]);
                if (isset($error_tmp[1]) && strpos($error_tmp[1], "LINE 1") >= 0) {
                    $array_error[2] = $error_tmp[0];
                }
            }

            $error = array("string" => "Internal Error while trying to execute Query");
            if (is_array($array_error) && COUNT($array_error) > 0) {
                $error = array(
                    "string" => "SQLSTATE error code -- " . $array_error[0] . " <br>Driver-specific error code -- " . $array_error[1] . " <br>Driver-specific error message -- " . $array_error[2],
                    "message" => $array_error[2],
                    "sqlstate_code" => $array_error[0],
                    "driver_code" => $array_error[1]
                );
            }
            return $this->errorResponse($error);
        }

        $result_data = $this->conn["statement_object"]->fetchAll(\PDO::FETCH_ASSOC);
        return $this->successResponse($result_data);
    }

    /**
     * Execute a Query String
     * @param string $query
     * @param array $parameters
     * @return response from "PGSQLClient::exec"
     */
    public function execQueryString($query = "", array $parameters = array())
    {
        $result_set_query = $this->setQuery($query);
        if (!$result_set_query["status"]) {
            return $result_set_query;
        }

        $result_set = $this->setQueryParameters($parameters);
        if (!$result_set["status"]) {
            return $result_set;
        }

        return $this->exec();
    }

    /**
     * Construct error Response Array and Close Conection to Server in case that is open
     * @param string $error_msg
     * @return array with the following fields:
     * status (FALSE)
     * query (In case that Query String has been specified)
     * data (empty)
     * error (a valid error message)
     */
    private function errorResponse(array $error = array())
    {
        if (!is_array($error) || COUNT($error) == 0) {
            throw new \Exception("You must to specify a valid error to return the Postgres Response");
        }
        $result = array("status" => FALSE, "query" => "", "data" => (isset($error['message'])) ? $error['message'] : array(), "error" => $error);
        if ($this->conn["query"]["string"] != "") {
            $result["query"] = $this->conn["query"]["string"];
        }
        if ($this->conn["conn_object"] != NULL) {
            $this->closeConn();
        }
        if (!$result['status']) {
            $error_code = "Undefined";
            if (isset($result['error']) && isset($result['error']['sqlstate_code'])) {
                $error_code = $result['error']['sqlstate_code'];
            }
            $error_desc = "Query Error";
            if (isset($result['query'])) {
                $error_desc = $result['query'];
            }
        }
        unset($result['query']);
        unset($result['error']);
        return $result;
    }

    /**
     * Construct success Response Array and Close Conection to Server in case that is open
     * @param string $data
     * @return array with the following fields:
     * status (TRUE)
     * query (In case that Query String has been specified)
     * data (a valid array result of the query execution)
     * error (empty)
     */
    private function successResponse($data = "")
    {
        if (!is_array($data)) {
            throw new \Exception("You must to specify a valid data array to return the Postgres Response");
        }
        $result = array("status" => TRUE, "query" => "", "data" => $data, "error" => "");
        if ($this->conn["query"]["string"] != "") {
            $result["query"] = $this->conn["query"]["string"];
        }
        if ($this->conn["conn_object"] != NULL) {
            $this->closeConn();
        }
        unset($result['query']);
        unset($result['error']);
        return $result;
    }
}
