/**
* Flags
*
* These are modifiers that set config variables as part of library accession.
* They are used by accessing an "_X" property as a function, where "X" is the
* flag name. Some flags may take arguments. All flags act to alter the config
* of the execution.
*
*   These expressions are all equivalent:
*
*   lib.utils.log._ignore()('My log data');
*   lib.utils._ignore().log('My log data');
*   lib._ignore().utils.log('My log data');
*
*   Setting a flag multiple times has no effect, so these are equivalent, too:
*
*   lib.utils.log._ignore()('My log data');
*   lib.utils.log._ignore()._ignore()._ignore()._ignore()('My Log data');
*   lib._ignore().utils._ignore().log._ignore()('My Log data');
*/

module.exports = {
  /**
  * Flag: ._ignore()
  * StdLib returns instant 200OK regardless of function response,
  *   Equivalent to ._webhook(true)
  */
  ignore: () => {
    return {webhook: true};
  }
};
