#!/usr/bin/env python

'''
Parse the flags.html, extracting the country and country_code used by flagsp_ css class 
'''

import re

# <span class="flagsp flagsp_bra" title="Brazil">

re_flag = re.compile(r'<span class="flagsp (\w+)" title="(\w+)">')

country_codes = {}

with open("flags.html", "r") as fh:
    for line in fh:
        m = re_flag.search(line)
        if m:
            flag_class = m.group(1)
            country = m.group(2)
            country_code = flag_class.split("_")[1]
            country_codes[country] = country_code
            
            
for country, code in country_codes.iteritems():
    print "%s\t%s" % (country, code)
