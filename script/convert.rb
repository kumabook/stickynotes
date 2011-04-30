# -*- coding: japanese-cp932 -*-
require 'kconv'
require 'nkf'

#読み込んだファイルの文字コード表示用配列
CODES = {
  NKF::JIS      => "JIS",
  NKF::EUC      => "EUC",
  NKF::SJIS     => "SJIS",
  NKF::BINARY   => "BINARY",
  NKF::UNKNOWN  => "判別失敗",
  NKF::ASCII    => "ASCII",
  NKF::UTF8  	=> "UTF-8",
  NKF::UTF16    => "UTF-16",
}

class Conv_save

  #コンバート
  def conv(src,enc,contents)

    #記録ファイル名は「オリジナル・ファイル名 + _文字コード.拡張子」
    #例:test.txtをEUC変換すると test_euc.txt になる
    # . で分割して拡張子とファイル名を取得
    org = src.split(/\./)
			

    distname = org[0] + "_" + enc + "."
    distname = distname + org[1]

    case enc
      when "sjis"
        contents = Kconv.tosjis(contents)
      when "euc"
        contents = Kconv.toeuc(contents)
      when "jis"
        contents = Kconv.tojis(contents)
      when "utf"
        contents = Kconv.toutf8(contents)
      else
        #変換しない
    end

    #ファイルに記録
    make_file(distname,contents)

  end
		
  #ファイル保存
  def make_file(filename,str)
    f = File.open(filename,'w')
    f.puts str
    f.close
  end
end

#クラスのインスタンスを生成
CS = Conv_save.new

#変換元ファイル名はコマンドライン引数から取得
#コマンドライン引数がある
if ARGV.length > 0
  #2個以上のファイルが指定されている
  if ARGV.length > 1
    print "一度にひとつのファイルしか処理できません\n"
    print "パスにスペースを含むファイルの場合は\"\"で括ってください\n"
    exit
  end
  #コマンドライン引数がない
else
  print "処理するファイル名を指定してください\n"
  exit
end

#最初のコマンドライン引数を処理ファイル名とみなす
src = ARGV[0]

#パスを除いたファイル名の取り出し
original = File.basename(src)

#処理するファイルのあるパスを取得
src_path = File.dirname(src)
#カレント・ディレクトリ移動
Dir.chdir(src_path)

#元ファイルを開いて内容を変数$contentsに格納
f = open(src, "r")
contents = f.read
f.close

#文字コード判定
print "\tconvert utf-8 to shift_jis: " + src + "\n"




#自分と同一フォーマットではないところは全て処理するので
#caseよりもunlessの方が効率的

#元がSJISでなければ
#SJISファイルの作成
unless NKF.guess(contents)==3
  CS::conv(original,"sjis",contents)
end

exit
