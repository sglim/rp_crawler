#!/bin/bash

readonly MECAB_VERSION=0.996-ko-0.9.2
readonly MECAB_KO_DIC_VERSION=2.0.1-20150920

set -ex

rm -rf tmp
mkdir tmp
cd tmp

# Download mecab
wget "https://bitbucket.org/eunjeon/mecab-ko/downloads/mecab-${MECAB_VERSION}.tar.gz"
wget "https://bitbucket.org/eunjeon/mecab-ko-dic/downloads/mecab-ko-dic-${MECAB_KO_DIC_VERSION}.tar.gz"
tar xfz "mecab-${MECAB_VERSION}.tar.gz"
tar xfz "mecab-ko-dic-${MECAB_KO_DIC_VERSION}.tar.gz"

# mecab-ko build
cd "mecab-${MECAB_VERSION}"
./configure
make
# If you are not the user has permission for /usr/local/lib, use sudo here
make install
cd ..

# mecab-ko-dic build
cd "mecab-ko-dic-${MECAB_KO_DIC_VERSION}"
./autogen.sh
./configure
make
# If you are not the user has permission for /usr/local/lib, use sudo here
make install
cd ..
